#include <windows.h>
#include <atomic>
#include <string>
#include <cassert>
#include <cstdio>
std::atomic<DWORD> g_targetThreadId=0;
#include "../ports/windows/src/settings-core-window.cpp.in"
static void Register(HINSTANCE instance,const wchar_t* name) {
    WNDCLASSW cls{};cls.hInstance=instance;cls.lpszClassName=name;cls.lpfnWndProc=DefWindowProcW;
    assert(RegisterClassW(&cls));
}
static HWND Window(HINSTANCE instance,const wchar_t* name,HWND parent=nullptr) {
    HWND window=CreateWindowExW(0,name,L"",parent?WS_CHILD:WS_OVERLAPPED,
        0,0,32,32,parent,nullptr,instance,nullptr);
    assert(window);return window;
}
int wmain(int argc,wchar_t** argv) {
    HINSTANCE instance=GetModuleHandleW(nullptr);
    Register(instance,L"Windows.UI.Core.CoreWindow");
    Register(instance,L"ApplicationFrameWindow");
    Register(instance,L"unrelated-settings-fixture");
    if(argc==4&&wcscmp(argv[1],L"--foreign")==0) {
        HWND window=Window(instance,L"Windows.UI.Core.CoreWindow");
        HANDLE ready=OpenEventW(EVENT_MODIFY_STATE,FALSE,argv[2]);
        HANDLE release=OpenEventW(SYNCHRONIZE,FALSE,argv[3]);
        assert(ready&&release);assert(SetEvent(ready));assert(WaitForSingleObject(release,10000)==WAIT_OBJECT_0);
        DestroyWindow(window);CloseHandle(ready);CloseHandle(release);return 0;
    }
    assert(GetCoreWnd()==nullptr);
    HWND unknown=Window(instance,L"unrelated-settings-fixture");assert(GetCoreWnd()==nullptr);
    HWND direct=Window(instance,L"Windows.UI.Core.CoreWindow");assert(GetCoreWnd()==direct);
    g_targetThreadId=GetCurrentThreadId()+1;assert(GetCoreWnd()==nullptr);
    g_targetThreadId=GetCurrentThreadId();assert(GetCoreWnd()==direct);
    HWND second=Window(instance,L"Windows.UI.Core.CoreWindow");assert(GetCoreWnd()==nullptr);
    DestroyWindow(second);assert(GetCoreWnd()==direct);
    DestroyWindow(direct);assert(GetCoreWnd()==nullptr);g_targetThreadId=0;
    HWND wrapper=Window(instance,L"ApplicationFrameWindow");
    HWND nested=Window(instance,L"Windows.UI.Core.CoreWindow",wrapper);assert(GetCoreWnd()==nested);
    direct=Window(instance,L"Windows.UI.Core.CoreWindow");assert(GetCoreWnd()==nullptr);
    DestroyWindow(direct);assert(GetCoreWnd()==nested);DestroyWindow(wrapper);assert(GetCoreWnd()==nullptr);
    wchar_t exe[32768]{};assert(GetModuleFileNameW(nullptr,exe,32768));
    std::wstring suffix=std::to_wstring(GetCurrentProcessId());
    std::wstring readyName=L"Local\\j3w1-settings-fixture-ready-"+suffix;
    std::wstring releaseName=L"Local\\j3w1-settings-fixture-release-"+suffix;
    HANDLE ready=CreateEventW(nullptr,TRUE,FALSE,readyName.c_str());
    HANDLE release=CreateEventW(nullptr,TRUE,FALSE,releaseName.c_str());assert(ready&&release);
    std::wstring command=L"\""+std::wstring(exe)+L"\" --foreign "+readyName+L" "+releaseName;
    STARTUPINFOW startup{sizeof(startup)};PROCESS_INFORMATION child{};
    assert(CreateProcessW(exe,command.data(),nullptr,nullptr,FALSE,CREATE_NO_WINDOW,nullptr,nullptr,&startup,&child));
    assert(WaitForSingleObject(ready,5000)==WAIT_OBJECT_0);
    assert(GetCoreWnd()==nullptr);direct=Window(instance,L"Windows.UI.Core.CoreWindow");
    assert(GetCoreWnd()==direct);DestroyWindow(direct);assert(SetEvent(release));
    assert(WaitForSingleObject(child.hProcess,5000)==WAIT_OBJECT_0);
    DWORD exit=1;assert(GetExitCodeProcess(child.hProcess,&exit)&&exit==0);
    CloseHandle(child.hThread);CloseHandle(child.hProcess);CloseHandle(ready);CloseHandle(release);
    assert(!j3w1Settings::Admit()); // The fixture cannot authorize the pinned app.
    assert(!j3w1Settings::DigestFile(exe,std::string(64,'0').c_str()));
    DestroyWindow(unknown);
    for(auto name:{L"Windows.UI.Core.CoreWindow",L"ApplicationFrameWindow",L"unrelated-settings-fixture"})assert(UnregisterClassW(name,instance));
    puts("Settings direct/framed discovery, thread ownership, ambiguity, foreign process, cleanup and exact-binary refusal passed");
}
