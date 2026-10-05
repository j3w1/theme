// Synthetic HWND and paint ownership tests; no desktop input or document data.
#include <windows.h>
#include <cassert>
#include <cstdio>
static BOOL Wh_SetFunctionHook(void* function,void*,void** original){*original=function;return TRUE;}
static BOOL Wh_ApplyHookOperations(){return TRUE;}
static int Wh_GetIntSetting(const wchar_t*){return 1;}
template<class... T>static void Wh_Log(const wchar_t*,T...){}
static bool testContrast=false,testContrastFailure=false;
static BOOL ContrastQuery(UINT action,UINT count,void* value,UINT flags){
 if(action==SPI_GETHIGHCONTRAST){if(testContrastFailure)return FALSE;auto result=static_cast<HIGHCONTRASTW*>(value);result->dwFlags=testContrast?HCF_HIGHCONTRASTON:0;return TRUE;}
 return SystemParametersInfoW(action,count,value,flags);
}
#define SystemParametersInfoW ContrastQuery
#include "../ports/windows/dist/j3w1-powertoys-markdown.wh.cpp"
#undef SystemParametersInfoW
int main(int argc,char**){
 if(argc==2)return 259; // STILL_ACTIVE is also a valid exit code; wait on lifetime instead.
 HINSTANCE instance=GetModuleHandleW(nullptr);HBRUSH gray=CreateSolidBrush(RGB(30,30,30)),later=CreateSolidBrush(RGB(61,61,61));assert(gray&&later);
 for(auto name:{L"CabinetWClass",L"Shell Preview Extension Host",L"Shell Preview Extension Host Previewer",L"unrelated-preview-parent"}){
  WNDCLASSW wc{};wc.hInstance=instance;wc.lpszClassName=name;wc.lpfnWndProc=DefWindowProcW;wc.hbrBackground=gray;assert(RegisterClassW(&wc));
 }
 HWND root=CreateWindowExW(0,L"CabinetWClass",L"",WS_OVERLAPPED,0,0,200,200,nullptr,nullptr,instance,nullptr);assert(root);
 HWND parent=CreateWindowExW(0,L"Shell Preview Extension Host",L"",WS_CHILD,0,0,150,150,root,nullptr,instance,nullptr);assert(parent);
 HWND window=CreateWindowExW(0,L"Shell Preview Extension Host Previewer",L"",WS_CHILD,0,0,100,100,parent,nullptr,instance,nullptr);assert(window);
 HWND wrongParent=CreateWindowExW(0,L"unrelated-preview-parent",L"",WS_CHILD,0,0,150,150,root,nullptr,instance,nullptr);assert(wrongParent);
 HWND unknown=CreateWindowExW(0,L"Shell Preview Extension Host Previewer",L"",WS_CHILD,0,0,100,100,wrongParent,nullptr,instance,nullptr);assert(unknown);
 nativePreviewMode=true;enabled=true;originalPreviewDefault=DefWindowProcW;
 HANDLE lifetime=OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION|SYNCHRONIZE,FALSE,GetCurrentProcessId());assert(lifetime);
 previewOwners.push_back({GetCurrentProcessId(),lifetime});assert(PreviewHostWindow(window));assert(!PreviewHostWindow(unknown));
 HDC dc=GetDC(window),foreign=GetDC(unknown),memory=CreateCompatibleDC(dc);assert(dc&&foreign&&memory);
 assert(PaintPreviewHost(window,dc));assert(GetClassLongPtrW(window,GCLP_HBRBACKGROUND)==reinterpret_cast<LONG_PTR>(gray));
 assert(!PaintPreviewHost(window,foreign)&&!PaintPreviewHost(window,memory)&&!PaintPreviewHost(unknown,foreign));
 assert(PreviewDefaultHook(window,WM_ERASEBKGND,reinterpret_cast<WPARAM>(dc),0)==1);
 assert(PreviewDefaultHook(window,WM_USER+1,0,0)==DefWindowProcW(window,WM_USER+1,0,0));
 enabled=false;assert(!PaintPreviewHost(window,dc));enabled=true;
 nativePreviewMode=false;assert(!PaintPreviewHost(window,dc));nativePreviewMode=true;
 testContrast=true;assert(!PaintPreviewHost(window,dc));testContrast=false;testContrastFailure=true;assert(!PaintPreviewHost(window,dc));testContrastFailure=false;
 SetClassLongPtrW(window,GCLP_HBRBACKGROUND,reinterpret_cast<LONG_PTR>(later));assert(!PaintPreviewHost(window,dc));
 assert(GetClassLongPtrW(window,GCLP_HBRBACKGROUND)==reinterpret_cast<LONG_PTR>(later));
 SetClassLongPtrW(window,GCLP_HBRBACKGROUND,reinterpret_cast<LONG_PTR>(gray));
 DWORD objects=GetGuiResources(GetCurrentProcess(),GR_GDIOBJECTS);for(unsigned i=0;i<100;i++)assert(PaintPreviewHost(window,dc));
 assert(GetGuiResources(GetCurrentProcess(),GR_GDIOBJECTS)==objects);
 ReleasePreviewOwners();assert(!PreviewHostWindow(window)&&!PaintPreviewHost(window,dc));
 wchar_t executable[32768]{};assert(GetModuleFileNameW(nullptr,executable,std::size(executable)));
 assert(!InitNativePreviewHost(executable)); // This unpinned fixture cannot authorize the production host.
 std::wstring command=L"\""+std::wstring(executable)+L"\" --exit259";
 STARTUPINFOW startup{sizeof(startup)};PROCESS_INFORMATION child{};
 assert(CreateProcessW(executable,command.data(),nullptr,nullptr,FALSE,CREATE_NO_WINDOW,nullptr,nullptr,&startup,&child));
 assert(WaitForSingleObject(child.hProcess,5000)==WAIT_OBJECT_0);
 DWORD exit=0;assert(GetExitCodeProcess(child.hProcess,&exit)&&exit==STILL_ACTIVE);
 previewOwners.push_back({child.dwProcessId,child.hProcess});
 assert(!PreviewOwnerAlive(child.dwProcessId));ReleasePreviewOwners();CloseHandle(child.hThread);
 DeleteDC(memory);ReleaseDC(unknown,foreign);ReleaseDC(window,dc);DestroyWindow(root);
 for(auto name:{L"CabinetWClass",L"Shell Preview Extension Host",L"Shell Preview Extension Host Previewer",L"unrelated-preview-parent"})assert(UnregisterClassW(name,instance));
 DeleteObject(later);DeleteObject(gray);
 puts("Preview-host erasure ownership, native fallback, high contrast, later color and stable GDI lifetime passed");
}
