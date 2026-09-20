// Bubble Chamber · Math × Physics — native Windows host.
// A single self-contained exe: the web app and the WebView2 SDK DLLs are embedded as app.zip and unpacked
// to %LOCALAPPDATA%\BubbleChamber_MathPhysics on first run. Rendering uses the WebView2 runtime that ships with Windows 10/11.
// Built with the .NET Framework C# 5 compiler (see build.ps1), so no newer language features here.
using System;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

static class Program
{
    const string Host = "bubblechamber.example";
    const string Title = "Bubble Chamber · Math × Physics";
    static string dataDir, appDir;

    [DllImport("user32.dll")]
    static extern bool SetProcessDPIAware();

    [STAThread]
    static void Main(string[] args)
    {
        SetProcessDPIAware();
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        try
        {
            dataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "BubbleChamber_MathPhysics");
            appDir = Unpack();
        }
        catch (Exception e)
        {
            MessageBox.Show("앱 파일을 준비하지 못했습니다.\n\n" + e.Message, Title, MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }
        // the WebView2 assemblies live in the unpacked folder, so resolve them from there
        AppDomain.CurrentDomain.AssemblyResolve += delegate(object s, ResolveEventArgs e)
        {
            string f = Path.Combine(appDir, "bin", new AssemblyName(e.Name).Name + ".dll");
            return File.Exists(f) ? Assembly.LoadFrom(f) : null;
        };
        bool fullscreen = Array.Exists(args, delegate(string a) { a = a.ToLowerInvariant(); return a == "/f" || a == "-f" || a == "--fullscreen"; });
        Run(fullscreen);
    }

    // kept out of Main so WebView2 types are first touched after AssemblyResolve is hooked
    [MethodImpl(MethodImplOptions.NoInlining)]
    static void Run(bool fullscreen)
    {
        Application.Run(new MainForm(fullscreen));
    }

    // Unpacks the embedded app.zip once per build (keyed by the exe's size and timestamp).
    static string Unpack()
    {
        FileInfo exe = new FileInfo(Application.ExecutablePath);
        string dir = Path.Combine(dataDir, "app-" + exe.Length.ToString("x") + "-" + exe.LastWriteTimeUtc.Ticks.ToString("x"));
        string stamp = Path.Combine(dir, ".ok");
        if (File.Exists(stamp)) return dir;

        Directory.CreateDirectory(dataDir);
        foreach (string old in Directory.GetDirectories(dataDir, "app-*"))
        {
            try { Directory.Delete(old, true); } catch { }
        }
        Directory.CreateDirectory(dir);
        using (Stream s = Assembly.GetExecutingAssembly().GetManifestResourceStream("app.zip"))
        using (ZipArchive zip = new ZipArchive(s, ZipArchiveMode.Read))
        {
            foreach (ZipArchiveEntry entry in zip.Entries)
            {
                string target = Path.GetFullPath(Path.Combine(dir, entry.FullName));
                if (!target.StartsWith(dir, StringComparison.OrdinalIgnoreCase)) continue;
                if (entry.FullName.EndsWith("/")) { Directory.CreateDirectory(target); continue; }
                Directory.CreateDirectory(Path.GetDirectoryName(target));
                entry.ExtractToFile(target, true);
            }
        }
        File.WriteAllText(stamp, "");
        return dir;
    }

    class MainForm : Form
    {
        readonly WebView2 web = new WebView2();
        bool isFullscreen;
        FormWindowState prevState;
        Rectangle prevBounds;

        public MainForm(bool startFullscreen)
        {
            Text = Title;
            BackColor = Color.Black;
            StartPosition = FormStartPosition.CenterScreen;
            Rectangle wa = Screen.PrimaryScreen.WorkingArea;
            ClientSize = new Size(Math.Min(1600, wa.Width * 4 / 5), Math.Min(900, wa.Height * 4 / 5));
            try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }

            web.Dock = DockStyle.Fill;
            web.DefaultBackgroundColor = Color.Black;
            Controls.Add(web);
            Load += delegate { Start(startFullscreen); };
        }

        async void Start(bool startFullscreen)
        {
            if (startFullscreen) SetFullscreen(true);
            try
            {
                CoreWebView2Environment.SetLoaderDllFolderPath(Path.Combine(appDir, "bin"));
                CoreWebView2Environment env = await CoreWebView2Environment.CreateAsync(null, Path.Combine(dataDir, "WebView2"), null);
                await web.EnsureCoreWebView2Async(env);
            }
            catch (Exception e)
            {
                MessageBox.Show("WebView2 런타임을 시작할 수 없습니다.\nhttps://developer.microsoft.com/microsoft-edge/webview2/ 에서 런타임을 설치해 주세요.\n\n" + e.Message,
                    Title, MessageBoxButtons.OK, MessageBoxIcon.Error);
                Close();
                return;
            }
            CoreWebView2 core = web.CoreWebView2;
            core.Settings.AreDefaultContextMenusEnabled = false;
            core.Settings.AreDevToolsEnabled = false;
            core.Settings.IsStatusBarEnabled = false;
            core.Settings.IsZoomControlEnabled = false;
            core.Settings.AreBrowserAcceleratorKeysEnabled = false;
            // the page's F key calls requestFullscreen(); mirror that onto the window itself
            core.ContainsFullScreenElementChanged += delegate { SetFullscreen(core.ContainsFullScreenElement); };

            // an index.html sitting next to the exe wins over the embedded copy (handy while editing the project)
            string side = Path.GetDirectoryName(Application.ExecutablePath);
            string root = File.Exists(Path.Combine(side, "index.html")) ? side : Path.Combine(appDir, "web");
            core.SetVirtualHostNameToFolderMapping(Host, root, CoreWebView2HostResourceAccessKind.Allow);
            core.Navigate("https://" + Host + "/index.html");
            web.Focus();
        }

        void SetFullscreen(bool on)
        {
            if (on == isFullscreen) return;
            isFullscreen = on;
            if (on)
            {
                prevState = WindowState;
                WindowState = FormWindowState.Normal;
                prevBounds = Bounds;
                FormBorderStyle = FormBorderStyle.None;
                Bounds = Screen.FromControl(this).Bounds;
                TopMost = true;
            }
            else
            {
                TopMost = false;
                FormBorderStyle = FormBorderStyle.Sizable;
                Bounds = prevBounds;
                WindowState = prevState;
            }
        }
    }
}
