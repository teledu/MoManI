namespace MoManI.WinExecApp
{
    class Program
    {
        static void Main()
        {
            var app = new Executor();
            var res = app.Run().Result;
        }
    }
}
