// Synthetic HWND and paint ownership tests; no desktop input or document data.
#include <windows.h>
#include <cassert>
#include <cstdio>
#include <new>
#include <thread>
static BOOL Wh_SetFunctionHook(void* function,void*,void** original){*original=function;return TRUE;}
static BOOL Wh_ApplyHookOperations(){return TRUE;}
static int Wh_GetIntSetting(const wchar_t*){return 1;}
template<class... T>static void Wh_Log(const wchar_t*,T...){}
static bool testContrast=false,testContrastFailure=false;
static BOOL ContrastQuery(UINT action,UINT count,void* value,UINT flags){
 if(action==SPI_GETHIGHCONTRAST){if(testContrastFailure)return FALSE;auto result=static_cast<HIGHCONTRASTW*>(value);result->dwFlags=testContrast?HCF_HIGHCONTRASTON:0;return TRUE;}
 return SystemParametersInfoW(action,count,value,flags);
}
static unsigned ownerOpenCount=0;
static bool ownerQueryThrows=false;
static HANDLE lastOwnerHandle=nullptr;
static HWND fixtureRoot=nullptr;
static BOOL WINAPI EnumerateFixtureRoots(WNDENUMPROC callback,LPARAM parameter){return !fixtureRoot||callback(fixtureRoot,parameter);}
static HANDLE WINAPI CountedOwnerOpen(DWORD access,BOOL inherit,DWORD process){
 ++ownerOpenCount;lastOwnerHandle=OpenProcess(access,inherit,process);return lastOwnerHandle;
}
static BOOL WINAPI OwnerImageQuery(HANDLE process,DWORD flags,LPWSTR name,PDWORD length){
 if(ownerQueryThrows)throw std::bad_alloc();return QueryFullProcessImageNameW(process,flags,name,length);
}
#define OpenProcess CountedOwnerOpen
#define QueryFullProcessImageNameW OwnerImageQuery
#define EnumWindows EnumerateFixtureRoots
#define SystemParametersInfoW ContrastQuery
#include "../ports/windows/dist/j3w1-powertoys-markdown.wh.cpp"
#undef SystemParametersInfoW
#undef OpenProcess
#undef EnumWindows
#undef QueryFullProcessImageNameW
static void ClosedHandle(HANDLE handle){DWORD flags=0;SetLastError(0);assert(!GetHandleInformation(handle,&flags)&&GetLastError()==ERROR_INVALID_HANDLE);}
int main(int argc,char**){
 if(argc==2)return 259; // STILL_ACTIVE is also a valid exit code; wait on lifetime instead.
 HINSTANCE instance=GetModuleHandleW(nullptr);HBRUSH gray=CreateSolidBrush(RGB(30,30,30)),later=CreateSolidBrush(RGB(61,61,61));assert(gray&&later);
 for(auto name:{L"CabinetWClass",L"Shell Preview Extension Host",L"Shell Preview Extension Host Previewer",L"unrelated-preview-parent"}){
  WNDCLASSW wc{};wc.hInstance=instance;wc.lpszClassName=name;wc.lpfnWndProc=DefWindowProcW;wc.hbrBackground=gray;assert(RegisterClassW(&wc));
 }
 HWND root=CreateWindowExW(0,L"CabinetWClass",L"",WS_OVERLAPPED,0,0,200,200,nullptr,nullptr,instance,nullptr);assert(root);
 fixtureRoot=root;
 HWND parent=CreateWindowExW(0,L"Shell Preview Extension Host",L"",WS_CHILD,0,0,150,150,root,nullptr,instance,nullptr);assert(parent);
 HWND window=CreateWindowExW(0,L"Shell Preview Extension Host Previewer",L"",WS_CHILD,0,0,100,100,parent,nullptr,instance,nullptr);assert(window);
 HWND wrongParent=CreateWindowExW(0,L"unrelated-preview-parent",L"",WS_CHILD,0,0,150,150,root,nullptr,instance,nullptr);assert(wrongParent);
 HWND unknown=CreateWindowExW(0,L"Shell Preview Extension Host Previewer",L"",WS_CHILD,0,0,100,100,wrongParent,nullptr,instance,nullptr);assert(unknown);
 nativePreviewMode=true;enabled=true;originalPreviewDefault=DefWindowProcW;previewOwnerAdmissionOpen=true;
 assert(PreviewHostRoot(window)==root&&!PreviewHostRoot(unknown));
 // A root appearing after startup must reach identity verification on refresh
 // and native lifecycle notifications. The fixture is deliberately unpinned:
 // attempted discovery must still refuse it, including after settings refresh.
 unsigned opens=ownerOpenCount;RefreshPreviewHosts();assert(ownerOpenCount==opens+1&&!PreviewHostWindow(window));
 ownerQueryThrows=true;opens=ownerOpenCount;DiscoverPreviewOwner(root,0);assert(ownerOpenCount==opens+1&&!PreviewHostWindow(window));ClosedHandle(lastOwnerHandle);ownerQueryThrows=false;
 opens=ownerOpenCount;PreviewDefaultHook(window,WM_SHOWWINDOW,TRUE,0);assert(ownerOpenCount==opens+1&&!PreviewHostWindow(window));
 WINDOWPOS position{window,nullptr,0,0,100,100,SWP_NOACTIVATE|SWP_NOZORDER};
 opens=ownerOpenCount;PreviewDefaultHook(window,WM_WINDOWPOSCHANGED,0,reinterpret_cast<LPARAM>(&position));assert(ownerOpenCount==opens+1&&!PreviewHostWindow(window));
 CREATESTRUCTW creation{};
 opens=ownerOpenCount;PreviewDefaultHook(window,WM_CREATE,0,reinterpret_cast<LPARAM>(&creation));assert(ownerOpenCount==opens+1&&!PreviewHostWindow(window));
 opens=ownerOpenCount;PreviewDefaultHook(unknown,WM_SHOWWINDOW,TRUE,0);assert(ownerOpenCount==opens);
 enabled=false;PreviewDefaultHook(window,WM_SHOWWINDOW,TRUE,0);assert(ownerOpenCount==opens);enabled=true;
 testContrast=true;PreviewDefaultHook(window,WM_SHOWWINDOW,TRUE,0);assert(ownerOpenCount==opens);testContrast=false;
 testContrastFailure=true;RefreshPreviewHosts();assert(ownerOpenCount==opens);testContrastFailure=false;
 nativePreviewMode=false;PreviewDefaultHook(window,WM_SHOWWINDOW,TRUE,0);assert(ownerOpenCount==opens);nativePreviewMode=true;
 HANDLE lifetime=OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION|SYNCHRONIZE,FALSE,GetCurrentProcessId());assert(lifetime);
 assert(CachePreviewOwner(GetCurrentProcessId(),lifetime));assert(PreviewHostWindow(window));assert(!PreviewHostWindow(unknown));
 HANDLE duplicate=OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION|SYNCHRONIZE,FALSE,GetCurrentProcessId());assert(duplicate);
 assert(!CachePreviewOwner(GetCurrentProcessId(),duplicate)&&previewOwners.size()==1);CloseHandle(duplicate);
 opens=ownerOpenCount;RefreshPreviewHosts();PreviewDefaultHook(window,WM_SHOWWINDOW,TRUE,0);assert(ownerOpenCount==opens);
 HDC dc=GetDC(window),foreign=GetDC(unknown),memory=CreateCompatibleDC(dc);assert(dc&&foreign&&memory);
 assert(PaintPreviewHost(window,dc));assert(GetClassLongPtrW(window,GCLP_HBRBACKGROUND)==reinterpret_cast<LONG_PTR>(gray));
 assert(!PaintPreviewHost(window,foreign)&&!PaintPreviewHost(window,memory)&&!PaintPreviewHost(unknown,foreign));
 opens=ownerOpenCount;assert(PreviewDefaultHook(window,WM_ERASEBKGND,reinterpret_cast<WPARAM>(dc),0)==1);assert(ownerOpenCount==opens);
 assert(PreviewDefaultHook(window,WM_USER+1,0,0)==DefWindowProcW(window,WM_USER+1,0,0));
 enabled=false;assert(!PaintPreviewHost(window,dc));enabled=true;
 nativePreviewMode=false;assert(!PaintPreviewHost(window,dc));nativePreviewMode=true;
 testContrast=true;assert(!PaintPreviewHost(window,dc));testContrast=false;testContrastFailure=true;assert(!PaintPreviewHost(window,dc));testContrastFailure=false;
 SetClassLongPtrW(window,GCLP_HBRBACKGROUND,reinterpret_cast<LONG_PTR>(later));assert(!PaintPreviewHost(window,dc));
 assert(GetClassLongPtrW(window,GCLP_HBRBACKGROUND)==reinterpret_cast<LONG_PTR>(later));
 SetClassLongPtrW(window,GCLP_HBRBACKGROUND,reinterpret_cast<LONG_PTR>(gray));
 DWORD objects=GetGuiResources(GetCurrentProcess(),GR_GDIOBJECTS);for(unsigned i=0;i<100;i++)assert(PaintPreviewHost(window,dc));
 assert(GetGuiResources(GetCurrentProcess(),GR_GDIOBJECTS)==objects);
 ReleasePreviewOwners();ClosedHandle(lifetime);assert(!PreviewHostWindow(window)&&!PaintPreviewHost(window,dc));
 opens=ownerOpenCount;RefreshPreviewHosts();PreviewDefaultHook(window,WM_SHOWWINDOW,TRUE,0);assert(ownerOpenCount==opens);
 lifetime=OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION|SYNCHRONIZE,FALSE,GetCurrentProcessId());assert(lifetime);
 assert(!CachePreviewOwner(GetCurrentProcessId(),lifetime));CloseHandle(lifetime);
 wchar_t executable[32768]{};assert(GetModuleFileNameW(nullptr,executable,std::size(executable)));
 assert(!InitNativePreviewHost(executable)); // This unpinned fixture cannot authorize the production host.
 assert(!previewOwnerAdmissionOpen);
 previewOwnerAdmissionOpen=true;
 std::wstring command=L"\""+std::wstring(executable)+L"\" --exit259";
 STARTUPINFOW startup{sizeof(startup)};PROCESS_INFORMATION child{};
 assert(CreateProcessW(executable,command.data(),nullptr,nullptr,FALSE,CREATE_NO_WINDOW|CREATE_SUSPENDED,nullptr,nullptr,&startup,&child));
 assert(CachePreviewOwner(child.dwProcessId,child.hProcess));
 assert(ResumeThread(child.hThread)!=static_cast<DWORD>(-1));assert(WaitForSingleObject(child.hProcess,5000)==WAIT_OBJECT_0);
 DWORD exit=0;assert(GetExitCodeProcess(child.hProcess,&exit)&&exit==STILL_ACTIVE);
 assert(!PreviewOwnerAlive(child.dwProcessId));DiscoverPreviewOwner(root,0);assert(previewOwners.empty());ClosedHandle(child.hProcess);CloseHandle(child.hThread);
 // Concurrent admission keeps exactly one handle; the rejected caller retains
 // ownership. Release then closes the winner and the admission gate atomically.
 HANDLE candidates[2]{OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION|SYNCHRONIZE,FALSE,GetCurrentProcessId()),OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION|SYNCHRONIZE,FALSE,GetCurrentProcessId())};
 assert(candidates[0]&&candidates[1]);bool admitted[2]{};
 std::thread first([&]{admitted[0]=CachePreviewOwner(GetCurrentProcessId(),candidates[0]);});
 std::thread second([&]{admitted[1]=CachePreviewOwner(GetCurrentProcessId(),candidates[1]);});first.join();second.join();
 assert(admitted[0]!=admitted[1]&&previewOwners.size()==1);CloseHandle(candidates[admitted[0]?1:0]);ReleasePreviewOwners();ClosedHandle(candidates[admitted[0]?0:1]);
 // Capacity is bounded by live owners, rather than all historical owners.
 previewOwnerAdmissionOpen=true;std::vector<PROCESS_INFORMATION> owners(17);
 for(size_t i=0;i<owners.size();++i){
  command=L"\""+std::wstring(executable)+L"\" --exit259";
  assert(CreateProcessW(executable,command.data(),nullptr,nullptr,FALSE,CREATE_NO_WINDOW|CREATE_SUSPENDED,nullptr,nullptr,&startup,&owners[i]));
  assert(CachePreviewOwner(owners[i].dwProcessId,owners[i].hProcess)==(i<16));
 }
 assert(previewOwners.size()==16);
 assert(ResumeThread(owners[0].hThread)!=static_cast<DWORD>(-1));assert(WaitForSingleObject(owners[0].hProcess,5000)==WAIT_OBJECT_0);
 assert(CachePreviewOwner(owners[16].dwProcessId,owners[16].hProcess)&&previewOwners.size()==16);ClosedHandle(owners[0].hProcess);
 for(size_t i=1;i<owners.size();++i){assert(ResumeThread(owners[i].hThread)!=static_cast<DWORD>(-1));assert(WaitForSingleObject(owners[i].hProcess,5000)==WAIT_OBJECT_0);}
 ReleasePreviewOwners();for(size_t i=0;i<owners.size();++i){if(i)ClosedHandle(owners[i].hProcess);CloseHandle(owners[i].hThread);}
 DeleteDC(memory);ReleaseDC(unknown,foreign);ReleaseDC(window,dc);DestroyWindow(root);
 for(auto name:{L"CabinetWClass",L"Shell Preview Extension Host",L"Shell Preview Extension Host Previewer",L"unrelated-preview-parent"})assert(UnregisterClassW(name,instance));
 DeleteObject(later);DeleteObject(gray);
 puts("Preview-host lifecycle discovery, identity refusal, bounded live-owner cache, concurrent admission, erasure ownership and native fallback passed");
}
