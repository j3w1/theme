// ==WindhawkMod==
// @id j3w1-powertoys-markdown
// @name j3w1 Windows preview backing and PowerToys Markdown
// @description Exact-version black and rose Markdown rendering adapter
// @version 1.4.0
// @author j3w1
// @include PowerToys.MarkdownPreviewHandler.exe
// @include prevhost.exe
// @architecture x86-64
// @compilerOptions -lbcrypt -luser32 -lole32 -lshell32 -lshlwapi -luuid -lgdi32
// ==/WindhawkMod==
// ==WindhawkModSettings==
/*
- enabled: true
*/
// ==/WindhawkModSettings==
#include <windows.h>
#include <tlhelp32.h>
#include <bcrypt.h>
#include <shlobj.h>
#include <shlwapi.h>
#include <string>
#include <vector>
#include <atomic>
#include <mutex>
#include <algorithm>
#include <limits>
#include <stdexcept>
#include <new>
#include <memory>

// Only identities and offsets of the reviewed generated headers are retained.
// No upstream template, previewed document, URI or filename is embedded/logged.
struct HeaderPin {size_t length,styleOffset,styleLength;const char* sha256;};
static constexpr HeaderPin headers[]={
 {2461,175,2249,"8a07eee9ee0b2317281ad2509d57e2db301db69bca04687e76b300e44a2c602d"},
 {2476,190,2249,"9b36963064d58718d4ac74a87e15e76c1a6f9085b2802e5ba206b881ca92fc79"},
 {2452,175,2240,"449a8fe0d7c0bca0b8792cf7d9597d0702773cb3ef71daf09c783c8bc39839ab"},
 {2467,190,2240,"30bebcadec2095b34c18f9a77e85dd3327b556a6864b84b5e55bb15eafecd651"},
};
static constexpr char palette[]=R"MD(*{box-sizing:border-box}body{margin:0;font:15px/24px "SauceCodePro NFM", "Source Code Pro", "Cascadia Mono", "Consolas", "Liberation Mono", "DejaVu Sans Mono", monospace;text-align:left}.container{width:100%;max-width:min(72ch,680px);margin:auto;padding:16px;overflow-wrap:anywhere}.container>:first-child{margin-top:0}p,ul,ol,pre,blockquote,table{margin:0 0 16px}li{margin-block:4px}ul,ol{padding-left:24px}li>p{margin:0}img{max-width:100%;height:auto}h1,h2,h3,h4,h5,h6{margin:24px 0 12px;font-weight:700;text-wrap:balance}h1{font-size:20px;line-height:28px}h2{font-size:16px;line-height:24px}h3,h4,h5,h6{font-size:13px;line-height:18px}pre{padding:12px;border:1px solid;overflow-x:auto}code,tt{font-size:13px;line-height:19px;padding:2px 4px}pre code{display:block;padding:0;font:inherit;white-space:pre;overflow-wrap:normal}strong,th{font-weight:700}em{font-style:italic}hr{border:0;border-top:1px solid;margin:24px 0}table{width:100%;border-spacing:0;border-collapse:collapse}td,th{padding:8px 12px;border:1px solid;text-align:left;vertical-align:top}blockquote{margin-inline:0;padding:8px 12px;border-left:4px solid}blockquote>:last-child{margin-bottom:0}input[type=checkbox]{accent-color:#e53935}@media(forced-colors:none){html,body{background:#000000;color:#e99499}h1,h2,h3,h4,h5,h6{color:#f4eeee}hr,td,th{border-color:#2b0e0d}th{background:#160b0b}pre,code,tt{font-family:"SauceCodePro NFM", "Source Code Pro", "Cascadia Mono", "Consolas", "Liberation Mono", "DejaVu Sans Mono", monospace;color:#e99499;background:#000000;border-radius:0}pre{font-size:13px;line-height:19px;border-color:#a3676b}blockquote{background:#160b0b;color:#e99499;border-color:#e53935}a{color:#f73f35;text-decoration:underline;text-decoration-color:#dc282e}a:hover{color:#f4eeee}a:focus-visible{outline:1px dashed #e53935;outline-offset:-2px}::selection{background:#911410;color:#f4eeee}html{scrollbar-color:#420f0c #000000}})MD";
static constexpr IID coreViewIID={0x76eceacb,0x0462,0x4d94,{0xac,0x83,0x42,0x3a,0x67,0x93,0x77,0x5e}};
static std::atomic<bool> enabled{false};
static std::mutex hookMutex,filesMutex;
static std::wstring tempFolder;
static std::vector<FILE_ID_INFO> createdFiles;
using NavigateFn=HRESULT(STDMETHODCALLTYPE*)(IUnknown*,LPCWSTR);
struct BackgroundColor {BYTE A,R,G,B;};
using SetBackgroundFn=HRESULT(STDMETHODCALLTYPE*)(IUnknown*,BackgroundColor);
using GetBackgroundFn=HRESULT(STDMETHODCALLTYPE*)(IUnknown*,BackgroundColor*);
using CloseControllerFn=HRESULT(STDMETHODCALLTYPE*)(IUnknown*);
struct BrowserPin {const char* sha256;size_t stringRva,navigateRva,backgroundGetterRva,backgroundSetterRva,closeRva;};
static constexpr BrowserPin browserPins[]={
 {"b08c60a6d316ad3e50c2a1d00f146d90fca3a8da08f22aef71722ac0ccebd6b7",0x896f0,0x89650,0x0,0x0,0x0}, // 154.0.4258.37
 {"89df7d69b27dd6c17228c7319e84e22a97076cb3d68271617490f38ab204ea3f",0x896f0,0x89650,0x0,0x0,0x0}, // 154.0.4258.48
 {"07b9416907225b99556c2a5242ecc6d16afd83d374b151285cfe41f164843c1c",0x8a290,0x8a1f0,0x58e50,0x58f10,0x57380}, // 154.0.4258.53
};
struct Boundary {HMODULE module=nullptr;bool attempted=false;std::atomic<bool> ready{false};NavigateFn originalString=nullptr,originalNavigate=nullptr;GetBackgroundFn getBackground=nullptr;SetBackgroundFn originalBackground=nullptr,publicBackground=nullptr;CloseControllerFn originalClose=nullptr;};
static Boundary boundaries[std::size(browserPins)];
static decltype(&LoadLibraryExW) originalLoadLibraryEx;
static decltype(&CreateFileW) originalCreateFile;

static bool HighContrast(){
 HIGHCONTRASTW value{sizeof(value)};
 return !SystemParametersInfoW(SPI_GETHIGHCONTRAST,sizeof(value),&value,0)||(value.dwFlags&HCF_HIGHCONTRASTON);
}
static decltype(&FillRect) originalFillRect;
static decltype(&SetTextColor) originalSetTextColor;
static decltype(&SetBkColor) originalSetBkColor;
static decltype(&BeginPaint) originalBeginPaint;
static decltype(&EndPaint) originalEndPaint;
static thread_local std::vector<HWND> paintWindows;
static constexpr COLORREF loadingBackground=RGB(0,0,0);
static constexpr COLORREF loadingForeground=RGB(233,148,153);
// The pinned host's loading UI uses WinForms Window/STATIC controls. Its
// opaque BackColor is painted with GDI FillRect; label text uses TextRenderer.
// Scope memory DCs to the originating paint HWND. Never recolor WebView content,
// arbitrary bitmaps, editors, or cached shared brushes.
static bool LoadingWindow(HWND window) {
    DWORD process=0;wchar_t name[128]{};
    if(!window || !GetWindowThreadProcessId(window,&process) || process!=GetCurrentProcessId()
        || !GetClassNameW(window,name,128)) return false;
    // GetClassName returns "Static" on the reviewed .NET 10 host. Windows class
    // names are case-insensitive; do not impose a different matching rule.
    return _wcsnicmp(name,L"WindowsForms10.Window.",22)==0
        || _wcsnicmp(name,L"WindowsForms10.Static.",22)==0;
}
static bool LoadingDC(HDC dc) {
    if(!enabled.load() || HighContrast()) return false;
    HWND owner=WindowFromDC(dc);
    return LoadingWindow(owner?owner:paintWindows.empty()?nullptr:paintWindows.back());
}
static HDC WINAPI BeginPaintHook(HWND window,LPPAINTSTRUCT paint) {
    HDC dc=originalBeginPaint(window,paint);
    if(dc)paintWindows.push_back(window);
    return dc;
}
static BOOL WINAPI EndPaintHook(HWND window,const PAINTSTRUCT* paint) {
    for(auto it=paintWindows.end();it!=paintWindows.begin();) {
        --it;if(*it==window){paintWindows.erase(it);break;}
    }
    return originalEndPaint(window,paint);
}
static int WINAPI LoadingFillHook(HDC dc,const RECT* rect,HBRUSH brush) {
    LOGBRUSH data{};
    // Exact dark-mode BackColor from the pinned PowerToys Settings class.
    if(LoadingDC(dc) && GetObjectW(brush,sizeof(data),&data)==sizeof(data)
        && data.lbStyle==BS_SOLID && data.lbColor==RGB(30,30,30)) {
        HBRUSH themed=CreateSolidBrush(loadingBackground);
        if(themed){int result=originalFillRect(dc,rect,themed);DeleteObject(themed);return result;}
    }
    return originalFillRect(dc,rect,brush);
}
static COLORREF WINAPI LoadingTextHook(HDC dc,COLORREF color) {
    if(color==RGB(255,255,255) && LoadingDC(dc))color=loadingForeground;
    return originalSetTextColor(dc,color);
}
static COLORREF WINAPI LoadingBkHook(HDC dc,COLORREF color) {
    if(color==RGB(30,30,30) && LoadingDC(dc))color=loadingBackground;
    return originalSetBkColor(dc,color);
}
static bool InitLoading() {
    return Wh_SetFunctionHook(reinterpret_cast<void*>(FillRect),reinterpret_cast<void*>(LoadingFillHook),reinterpret_cast<void**>(&originalFillRect))
        && Wh_SetFunctionHook(reinterpret_cast<void*>(SetTextColor),reinterpret_cast<void*>(LoadingTextHook),reinterpret_cast<void**>(&originalSetTextColor))
        && Wh_SetFunctionHook(reinterpret_cast<void*>(SetBkColor),reinterpret_cast<void*>(LoadingBkHook),reinterpret_cast<void**>(&originalSetBkColor))
        && Wh_SetFunctionHook(reinterpret_cast<void*>(BeginPaint),reinterpret_cast<void*>(BeginPaintHook),reinterpret_cast<void**>(&originalBeginPaint))
        && Wh_SetFunctionHook(reinterpret_cast<void*>(EndPaint),reinterpret_cast<void*>(EndPaintHook),reinterpret_cast<void**>(&originalEndPaint));
}

static bool Digest(const BYTE* bytes,size_t size,const char* expected){
 if(size>std::numeric_limits<ULONG>::max())return false;
 BCRYPT_ALG_HANDLE algorithm=nullptr;BCRYPT_HASH_HANDLE hash=nullptr;BYTE result[32]{};bool ok=false;
 if(BCryptOpenAlgorithmProvider(&algorithm,BCRYPT_SHA256_ALGORITHM,nullptr,0)>=0
  && BCryptCreateHash(algorithm,&hash,nullptr,0,nullptr,0,0)>=0){
  ok=BCryptHashData(hash,const_cast<BYTE*>(bytes),static_cast<ULONG>(size),0)>=0&&BCryptFinishHash(hash,result,sizeof(result),0)>=0;
 }
 if(hash)BCryptDestroyHash(hash);if(algorithm)BCryptCloseAlgorithmProvider(algorithm,0);
 const char hex[]="0123456789abcdef";char actual[65]{};
 for(size_t i=0;i<32;i++){actual[i*2]=hex[result[i]>>4];actual[i*2+1]=hex[result[i]&15];}
 return ok&&strcmp(actual,expected)==0;
}
static bool DigestFile(const std::wstring& path,const char* expected){
 HANDLE file=CreateFileW(path.c_str(),GENERIC_READ,FILE_SHARE_READ,nullptr,OPEN_EXISTING,FILE_FLAG_OPEN_REPARSE_POINT,nullptr);
 if(file==INVALID_HANDLE_VALUE)return false;
 BY_HANDLE_FILE_INFORMATION info{};BCRYPT_ALG_HANDLE algorithm=nullptr;BCRYPT_HASH_HANDLE hash=nullptr;bool ok=false;
 if(GetFileInformationByHandle(file,&info)&&!(info.dwFileAttributes&FILE_ATTRIBUTE_REPARSE_POINT)
  && BCryptOpenAlgorithmProvider(&algorithm,BCRYPT_SHA256_ALGORITHM,nullptr,0)>=0
  && BCryptCreateHash(algorithm,&hash,nullptr,0,nullptr,0,0)>=0){
  BYTE buffer[65536],result[32]{};DWORD count=0;ok=true;
  for(;;){if(!ReadFile(file,buffer,sizeof(buffer),&count,nullptr)){ok=false;break;}if(!count)break;
   if(BCryptHashData(hash,buffer,count,0)<0){ok=false;break;}}
  ok=ok&&BCryptFinishHash(hash,result,sizeof(result),0)>=0;
  const char hex[]="0123456789abcdef";char actual[65]{};
  for(size_t i=0;i<32;i++){actual[i*2]=hex[result[i]>>4];actual[i*2+1]=hex[result[i]&15];}ok=ok&&strcmp(actual,expected)==0;
 }
 if(hash)BCryptDestroyHash(hash);if(algorithm)BCryptCloseAlgorithmProvider(algorithm,0);CloseHandle(file);return ok;
}
// Native shell preview backing belongs to prevhost, before PowerToys creates
// its WinForms/WebView children. Never change a shared class brush or pixels.
static bool nativePreviewMode=false;
static decltype(&DefWindowProcW) originalPreviewDefault;
struct PreviewOwner {DWORD process;HANDLE lifetime;};
static std::vector<PreviewOwner> previewOwners;
static std::mutex previewOwnerMutex;
static bool PreviewOwnerAlive(DWORD process) {
 std::lock_guard guard(previewOwnerMutex);
 for(const auto& owner:previewOwners)if(owner.process==process) {
  return WaitForSingleObject(owner.lifetime,0)==WAIT_TIMEOUT;
 }return false;
}
static BOOL CALLBACK DiscoverPreviewOwner(HWND window,LPARAM) {
 wchar_t name[64]{};DWORD process=0;
 if(!GetClassNameW(window,name,64)||_wcsicmp(name,L"CabinetWClass")
  ||!GetWindowThreadProcessId(window,&process)||PreviewOwnerAlive(process)||previewOwners.size()>=16)return TRUE;
 HANDLE lifetime=OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION|SYNCHRONIZE,FALSE,process);
 if(!lifetime)return TRUE;
 wchar_t exe[32768]{};DWORD length=std::size(exe);
 if(QueryFullProcessImageNameW(lifetime,0,exe,&length)&&length<std::size(exe)
  &&DigestFile(exe,"34ac55b23b6d840cc9fa8304c0149b8bb026d817b39610728092878d634a61eb")) {
  try{std::lock_guard guard(previewOwnerMutex);previewOwners.push_back({process,lifetime});return TRUE;}catch(...){}
 }CloseHandle(lifetime);return TRUE;
}
static bool PreviewHostWindow(HWND window) {
 if(!window)return false;
 DWORD process=0,parentProcess=0,rootProcess=0;
 GetWindowThreadProcessId(window,&process);
 HWND parent=GetParent(window),root=GetAncestor(window,GA_ROOT);
 GetWindowThreadProcessId(parent,&parentProcess);GetWindowThreadProcessId(root,&rootProcess);
 wchar_t name[128]{},parentName[128]{},rootName[64]{};
 return process==GetCurrentProcessId()&&parentProcess==rootProcess&&PreviewOwnerAlive(rootProcess)
  &&GetClassNameW(window,name,128)&&_wcsicmp(name,L"Shell Preview Extension Host Previewer")==0
  &&GetClassNameW(parent,parentName,128)&&_wcsicmp(parentName,L"Shell Preview Extension Host")==0
  &&GetClassNameW(root,rootName,64)&&_wcsicmp(rootName,L"CabinetWClass")==0;
}
static bool PaintPreviewHost(HWND window,HDC dc) {
 if(!nativePreviewMode||!enabled.load()||HighContrast()||!PreviewHostWindow(window)
  ||WindowFromDC(dc)!=window)return false;
 LOGBRUSH original{};
 auto brush=reinterpret_cast<HBRUSH>(GetClassLongPtrW(window,GCLP_HBRBACKGROUND));
 if(GetObjectW(brush,sizeof(original),&original)!=sizeof(original)
  ||original.lbStyle!=BS_SOLID||original.lbColor!=RGB(30,30,30))return false;
 // The current host-owned brush is checked on every erase. Unknown or later
 // colors keep native painting. Filling consumes no document/window contents.
 RECT rect{};if(!GetClientRect(window,&rect))return false;
 HBRUSH canvas=CreateSolidBrush(loadingBackground);if(!canvas)return false;
 int result=FillRect(dc,&rect,canvas);DeleteObject(canvas);return result!=0;
}
static LRESULT WINAPI PreviewDefaultHook(HWND window,UINT message,WPARAM wp,LPARAM lp) {
 if(message==WM_ERASEBKGND&&PaintPreviewHost(window,reinterpret_cast<HDC>(wp)))return 1;
 return originalPreviewDefault(window,message,wp,lp);
}
static BOOL CALLBACK RefreshPreviewChild(HWND window,LPARAM) {
 if(PreviewHostWindow(window))RedrawWindow(window,nullptr,nullptr,RDW_INVALIDATE|RDW_ERASE|RDW_NOCHILDREN);
 return TRUE;
}
static BOOL CALLBACK RefreshPreviewRoot(HWND window,LPARAM) {
 DWORD process=0;GetWindowThreadProcessId(window,&process);
 if(PreviewOwnerAlive(process))EnumChildWindows(window,RefreshPreviewChild,0);
 return TRUE;
}
static void RefreshPreviewHosts(){EnumWindows(RefreshPreviewRoot,0);}
static void ReleasePreviewOwners(){std::lock_guard guard(previewOwnerMutex);for(auto owner:previewOwners)CloseHandle(owner.lifetime);previewOwners.clear();}
static bool InitNativePreviewHost(const std::wstring& exe) {
 if(!DigestFile(exe,"0402afd1e3231da4841a093040f861b1af321f3dd6740c879de9d1e3d600d95e"))return false;
 // Cache exact external owner identities before installing paint hooks. No
 // executable/file query takes place inside the erase callback.
 EnumWindows(DiscoverPreviewOwner,0);
 nativePreviewMode=true;enabled=Wh_GetIntSetting(L"enabled")!=0;
 if(!Wh_SetFunctionHook(reinterpret_cast<void*>(DefWindowProcW),reinterpret_cast<void*>(PreviewDefaultHook),reinterpret_cast<void**>(&originalPreviewDefault))) {
  enabled=false;nativePreviewMode=false;ReleasePreviewOwners();return false;
 }return true;
}

// The pinned PowerToys host requests transparent white on the reviewed public
// Controller2 setter. Keep the browser backing opaque before HTML is painted.
// Every controller receipt belongs to its UI thread; no COM pointer is used
// from the Windhawk management thread. Later host colors remain host-owned.
struct BackgroundReceipt {
 BackgroundColor before{},applied{};bool owned=false,changed=false;
};
static bool SameBackground(BackgroundColor a,BackgroundColor b){return a.A==b.A&&a.R==b.R&&a.G==b.G&&a.B==b.B;}
static constexpr BackgroundColor browserCanvas={255,0,0,0};
static bool TransparentHostBackground(BackgroundColor c){return SameBackground(c,{0,255,255,255});}
template<class Read,class Write> static bool RestoreBackground(BackgroundReceipt& receipt,Read read,Write write){
 if(!receipt.owned)return true;BackgroundColor current{};HRESULT got=read(&current);
 if(FAILED(got))return false;
 if(!SameBackground(current,receipt.applied)){receipt.owned=false;receipt.changed=true;return true;}
 if(FAILED(write(receipt.before)))return false;
 receipt.owned=false;return true;
}
struct OwnedController {IUnknown* object=nullptr;GetBackgroundFn read=nullptr;SetBackgroundFn write=nullptr;BackgroundReceipt receipt;};
struct BackgroundThread {HWND channel=nullptr;WNDPROC original=nullptr;std::vector<OwnedController> controllers;bool cleaning=false;};
static thread_local BackgroundThread* backgroundThread=nullptr;
static std::mutex backgroundMutex;
static std::vector<HWND> backgroundChannels;
static UINT backgroundMessage=0;
static constexpr UINT_PTR backgroundTimer=0x4a334d44;
static constexpr IID controller2IID={0xc979903e,0xd4ca,0x4228,{0x92,0xeb,0x47,0xee,0x3f,0xa9,0x6e,0xab}};
static void UpdateBackgroundEnvironment(bool active);
static bool BackgroundOverrideExists();
static void PinBackgroundCleanup(){HMODULE self=nullptr;GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS|GET_MODULE_HANDLE_EX_FLAG_PIN,reinterpret_cast<LPCWSTR>(PinBackgroundCleanup),&self);}
static bool RestoreControllers(BackgroundThread& state){
 bool complete=true;
 for(auto it=state.controllers.begin();it!=state.controllers.end();){
  bool restored=RestoreBackground(it->receipt,[&](BackgroundColor* c){return it->read(it->object,c);},[&](BackgroundColor c){return it->write(it->object,c);});
  if(restored){it->object->Release();it=state.controllers.erase(it);}else{complete=false;++it;}
 }
 return complete;
}
static LRESULT CALLBACK BackgroundChannel(HWND window,UINT message,WPARAM wParam,LPARAM lParam){
 auto state=reinterpret_cast<BackgroundThread*>(GetWindowLongPtrW(window,GWLP_USERDATA));if(!state)return DefWindowProcW(window,message,wParam,lParam);
 if(message==WM_NCDESTROY||(message==backgroundMessage&&wParam==1))state->cleaning=true;
 if(message==backgroundMessage||(message==WM_TIMER&&wParam==backgroundTimer)||message==WM_NCDESTROY){
  bool highContrast=HighContrast();if(highContrast)UpdateBackgroundEnvironment(false);
  bool restore=state->cleaning||!enabled.load()||highContrast;
  if(restore){bool complete=RestoreControllers(*state);
   if(state->cleaning&&complete){auto original=state->original;
    KillTimer(window,backgroundTimer);SetWindowLongPtrW(window,GWLP_WNDPROC,reinterpret_cast<LONG_PTR>(original));SetWindowLongPtrW(window,GWLP_USERDATA,0);
    {std::lock_guard guard(backgroundMutex);backgroundChannels.erase(std::remove(backgroundChannels.begin(),backgroundChannels.end(),window),backgroundChannels.end());}
    if(backgroundThread==state)backgroundThread=nullptr;delete state;
    if(message==WM_NCDESTROY)return CallWindowProcW(original,window,message,wParam,lParam);
    DestroyWindow(window);return 0;
   }
   if(state->cleaning&&!complete){PinBackgroundCleanup();if(message==WM_NCDESTROY){KillTimer(window,backgroundTimer);SetWindowLongPtrW(window,GWLP_USERDATA,0);return CallWindowProcW(state->original,window,message,wParam,lParam);}}
  }
  if(message!=WM_NCDESTROY)return 0;
 }
 return CallWindowProcW(state->original,window,message,wParam,lParam);
}
static BackgroundThread* EnsureBackgroundThread(){
 if(backgroundThread)return backgroundThread->cleaning?nullptr:backgroundThread;
 if(!backgroundMessage)return nullptr;
 HWND channel=CreateWindowExW(0,L"STATIC",nullptr,0,0,0,0,0,HWND_MESSAGE,nullptr,nullptr,nullptr);if(!channel)return nullptr;
 auto state=new(std::nothrow) BackgroundThread;if(!state){DestroyWindow(channel);return nullptr;}state->channel=channel;
 state->original=reinterpret_cast<WNDPROC>(SetWindowLongPtrW(channel,GWLP_WNDPROC,reinterpret_cast<LONG_PTR>(BackgroundChannel)));
 if(!state->original){delete state;DestroyWindow(channel);return nullptr;}
 SetWindowLongPtrW(channel,GWLP_USERDATA,reinterpret_cast<LONG_PTR>(state));
 if(!SetTimer(channel,backgroundTimer,250,nullptr)){SetWindowLongPtrW(channel,GWLP_WNDPROC,reinterpret_cast<LONG_PTR>(state->original));SetWindowLongPtrW(channel,GWLP_USERDATA,0);delete state;DestroyWindow(channel);return nullptr;}
 try {std::lock_guard guard(backgroundMutex);backgroundChannels.push_back(channel);}
 catch(...){KillTimer(channel,backgroundTimer);SetWindowLongPtrW(channel,GWLP_WNDPROC,reinterpret_cast<LONG_PTR>(state->original));SetWindowLongPtrW(channel,GWLP_USERDATA,0);delete state;DestroyWindow(channel);return nullptr;}
 backgroundThread=state;return state;
}
template<size_t Index> static HRESULT STDMETHODCALLTYPE BackgroundHook(IUnknown* owner,BackgroundColor requested){
 auto& boundary=boundaries[Index];
 if(!enabled.load()||!boundary.ready||HighContrast()||BackgroundOverrideExists()||!owner)return boundary.originalBackground(owner,requested);
 try {
 IUnknown* controller=nullptr;
 if(FAILED(owner->QueryInterface(controller2IID,reinterpret_cast<void**>(&controller)))||!controller)return boundary.originalBackground(owner,requested);
 auto release=[](IUnknown* value){if(value)value->Release();};std::unique_ptr<IUnknown,decltype(release)> acquired(controller,release);
 // The returned Controller2 interface must use the independently observed
 // public setter/getter for this admitted module. QI identity alone is insufficient.
 void** table=*reinterpret_cast<void***>(controller);
 bool exact=table[26]==reinterpret_cast<void*>(boundary.getBackground)&&table[27]==reinterpret_cast<void*>(boundary.publicBackground);
 if(!exact)return boundary.originalBackground(owner,requested);
 auto state=EnsureBackgroundThread();if(!state)return boundary.originalBackground(owner,requested);
 auto found=std::find_if(state->controllers.begin(),state->controllers.end(),[&](auto const& item){return item.object==controller;});
 if(!TransparentHostBackground(requested)){
  HRESULT result=boundary.originalBackground(owner,requested);
  if(SUCCEEDED(result)&&found!=state->controllers.end()){found->object->Release();state->controllers.erase(found);}
  return result;
 }
 if(found==state->controllers.end()){
  if(state->controllers.size()>=32)return boundary.originalBackground(owner,requested);
  BackgroundColor current{};if(FAILED(boundary.getBackground(controller,&current)))return boundary.originalBackground(owner,requested);
  state->controllers.push_back({controller,boundary.getBackground,boundary.publicBackground,{}});found=state->controllers.end()-1;
  acquired.release();
 }
 HRESULT result=boundary.originalBackground(owner,browserCanvas);
 if(SUCCEEDED(result)){found->receipt={requested,browserCanvas,true,false};}
 else if(!found->receipt.owned){found->object->Release();state->controllers.erase(found);}
 return result;
 }catch(...){return boundary.originalBackground(owner,requested);}
}
template<size_t Index> static HRESULT STDMETHODCALLTYPE BackgroundCloseHook(IUnknown* owner){
 auto& boundary=boundaries[Index];IUnknown* identity=nullptr;
 if(owner)owner->QueryInterface(controller2IID,reinterpret_cast<void**>(&identity));
 HRESULT result=boundary.originalClose(owner);
 // Close is forwarded unchanged. A successfully closed view has no visible
 // backing to restore, so release its receipt on the same UI thread.
 if(SUCCEEDED(result)&&backgroundThread){auto& entries=backgroundThread->controllers;
  auto found=std::find_if(entries.begin(),entries.end(),[&](auto const& item){return item.object==identity;});
  if(found!=entries.end()){found->object->Release();entries.erase(found);}
 }if(identity)identity->Release();return result;
}
static void RestoreBackgroundThreads(){
 std::vector<HWND> copy;{std::lock_guard guard(backgroundMutex);copy=backgroundChannels;}
 for(HWND window:copy)if(IsWindow(window)&&GetWindowLongPtrW(window,GWLP_WNDPROC)==reinterpret_cast<LONG_PTR>(BackgroundChannel)){
  DWORD_PTR result=0;if(!SendMessageTimeoutW(window,backgroundMessage,1,0,SMTO_ABORTIFHUNG|SMTO_BLOCK,1000,&result))PinBackgroundCleanup();
 }
}
// Microsoft documents that setting the default before renderer creation also
// prevents its initial white frame. This environment value is process-local,
// never a user or machine setting. Preserve preexisting and later host values.
static bool backgroundEnvironmentOwned=false;
static constexpr wchar_t backgroundEnvironmentKey[]=L"WEBVIEW2_DEFAULT_BACKGROUND_COLOR";
static constexpr wchar_t backgroundEnvironmentValue[]=L"FF000000";
static bool BackgroundOverrideExists(){
 std::lock_guard guard(backgroundMutex);
 // A later process override ends our ownership before admitting any setter.
 // Do not let a stale receipt defeat the host's new renderer default.
 if(backgroundEnvironmentOwned){
  wchar_t current[32]{};DWORD read=GetEnvironmentVariableW(backgroundEnvironmentKey,current,std::size(current));
  if(read&&read<std::size(current)&&wcscmp(current,backgroundEnvironmentValue)==0)return false;
  backgroundEnvironmentOwned=false;
 }
 SetLastError(ERROR_SUCCESS);DWORD size=GetEnvironmentVariableW(backgroundEnvironmentKey,nullptr,0);
 return size!=0||GetLastError()!=ERROR_ENVVAR_NOT_FOUND;
}
static void UpdateBackgroundEnvironment(bool active){
 std::lock_guard guard(backgroundMutex);
 SetLastError(ERROR_SUCCESS);DWORD size=GetEnvironmentVariableW(backgroundEnvironmentKey,nullptr,0);DWORD error=GetLastError();
 if(active){
  if(!backgroundEnvironmentOwned&&size==0&&error==ERROR_ENVVAR_NOT_FOUND)
   backgroundEnvironmentOwned=SetEnvironmentVariableW(backgroundEnvironmentKey,backgroundEnvironmentValue)!=FALSE;
 }else if(backgroundEnvironmentOwned){
  std::vector<wchar_t> value(size?size:1);DWORD read=GetEnvironmentVariableW(backgroundEnvironmentKey,value.data(),static_cast<DWORD>(value.size()));
  if(read&&read<value.size()&&wcscmp(value.data(),backgroundEnvironmentValue)==0){
   if(SetEnvironmentVariableW(backgroundEnvironmentKey,nullptr))backgroundEnvironmentOwned=false;
  }else backgroundEnvironmentOwned=false;
 }
}

static size_t MaximumHeader(const HeaderPin* pins=headers,size_t count=std::size(headers)){
 size_t length=0;for(size_t i=0;i<count;i++)length=std::max(length,pins[i].length);return length;
}
static const HeaderPin* MatchHeader(const char* prefix,size_t size,const HeaderPin* pins=headers,size_t count=std::size(headers)){
 for(size_t i=0;i<count;i++){const auto& pin=pins[i];
  if(pin.styleOffset>pin.length||pin.styleLength>pin.length-pin.styleOffset)continue;
  if(size>=pin.length&&Digest(reinterpret_cast<const BYTE*>(prefix),pin.length,pin.sha256))return &pin;}
 return nullptr;
}
static std::string Style(const HeaderPin& pin){
 std::string style=palette;
 if(style.size()>pin.styleLength)throw std::length_error("Palette exceeds admitted CSS extent");
 style.resize(pin.styleLength,' ');return style;
}
static bool IsCoreView(IUnknown* view){
 if(!view)return false;IUnknown* core=nullptr;HRESULT result=view->QueryInterface(coreViewIID,reinterpret_cast<void**>(&core));
 if(core)core->Release();return SUCCEEDED(result)&&core;
}
static bool PaletteString(LPCWSTR html,std::wstring& themed,const HeaderPin* pins=headers,size_t count=std::size(headers)){
 if(!html)return false;
 size_t length=wcsnlen(html,MaximumHeader(pins,count));std::string prefix;prefix.reserve(length);
 for(size_t i=0;i<length;i++){if(html[i]>127)return false;prefix+=static_cast<char>(html[i]);}
 const auto* pin=MatchHeader(prefix.data(),prefix.size(),pins,count);if(!pin)return false;
 // NavigateToString consumes this LPCWSTR synchronously. The complete suffix,
 // including all Unicode document data, is passed through unchanged.
    themed=html;std::string style=Style(*pin);
 themed.replace(pin->styleOffset,pin->styleLength,std::wstring(style.begin(),style.end()));return true;
}
template<size_t Index> static HRESULT STDMETHODCALLTYPE StringHook(IUnknown* view,LPCWSTR html){
 auto& boundary=boundaries[Index];
 if(enabled&&boundary.ready&&!HighContrast()&&IsCoreView(view)){
  try{std::wstring themed;if(PaletteString(html,themed))return boundary.originalString(view,themed.c_str());}catch(...){}
 }
 return boundary.originalString(view,html);
}
static bool GuidHtml(const wchar_t* leaf){
 if(!leaf||wcslen(leaf)!=41||_wcsicmp(leaf+36,L".html"))return false;
 for(size_t i=0;i<36;i++){
  if(i==8||i==13||i==18||i==23){if(leaf[i]!=L'-')return false;}
  else if(!((leaf[i]>=L'0'&&leaf[i]<=L'9')||(leaf[i]>=L'a'&&leaf[i]<=L'f')||(leaf[i]>=L'A'&&leaf[i]<=L'F')))return false;
 }return true;
}
static bool TempPath(const std::wstring& path){
 return !tempFolder.empty()&&path.size()>tempFolder.size()&&_wcsnicmp(path.c_str(),tempFolder.c_str(),tempFolder.size())==0
  &&GuidHtml(path.c_str()+tempFolder.size());
}
static bool NoReparseParents(const std::wstring& path){
 if(path.size()<4||path[1]!=L':'||path[2]!=L'\\')return false;
 for(size_t i=3;i<path.size();i++)if(path[i]==L'\\'){
  DWORD attributes=GetFileAttributesW(path.substr(0,i).c_str());
  if(attributes==INVALID_FILE_ATTRIBUTES||!(attributes&FILE_ATTRIBUTE_DIRECTORY)||(attributes&FILE_ATTRIBUTE_REPARSE_POINT))return false;
 }return true;
}
static bool FileIdentity(HANDLE file,const std::wstring& path,FILE_ID_INFO& identity){
 BY_HANDLE_FILE_INFORMATION info{};wchar_t final[32768]{};
 DWORD length=GetFinalPathNameByHandleW(file,final,32768,FILE_NAME_NORMALIZED|VOLUME_NAME_DOS);
 std::wstring expected=L"\\\\?\\"+path;
 return length&&length<32768&&_wcsicmp(final,expected.c_str())==0&&NoReparseParents(path)
  &&GetFileInformationByHandle(file,&info)&&!(info.dwFileAttributes&(FILE_ATTRIBUTE_REPARSE_POINT|FILE_ATTRIBUTE_DIRECTORY))
  &&info.nNumberOfLinks==1&&GetFileInformationByHandleEx(file,FileIdInfo,&identity,sizeof(identity));
}
static bool SameIdentity(const FILE_ID_INFO& a,const FILE_ID_INFO& b){return a.VolumeSerialNumber==b.VolumeSerialNumber&&memcmp(&a.FileId,&b.FileId,sizeof(a.FileId))==0;}
static bool CreatedHere(const FILE_ID_INFO& id){std::lock_guard lock(filesMutex);return std::any_of(createdFiles.begin(),createdFiles.end(),[&](const auto& item){return SameIdentity(item,id);});}
static HANDLE WINAPI CreateHook(LPCWSTR path,DWORD access,DWORD share,LPSECURITY_ATTRIBUTES security,DWORD disposition,DWORD flags,HANDLE model){
 HANDLE file=originalCreateFile(path,access,share,security,disposition,flags,model);DWORD error=GetLastError();
 if(file!=INVALID_HANDLE_VALUE&&path&&enabled&&(access&GENERIC_WRITE)&&(disposition==CREATE_NEW||disposition==CREATE_ALWAYS)
  &&error!=ERROR_ALREADY_EXISTS){try{FILE_ID_INFO id{};if(TempPath(path)&&FileIdentity(file,path,id)){
   std::lock_guard lock(filesMutex);if(createdFiles.size()==64)createdFiles.erase(createdFiles.begin());createdFiles.push_back(id);
  }}catch(...){}
 }SetLastError(error);return file;
}
enum class FilePaletteResult { unchanged, changed, restorationFailed };
static FilePaletteResult PaletteFile(const std::wstring& path,const HeaderPin* pins=headers,size_t count=std::size(headers)){
 if(!TempPath(path)||!NoReparseParents(path))return FilePaletteResult::unchanged;
 HANDLE file=CreateFileW(path.c_str(),GENERIC_READ|GENERIC_WRITE,FILE_SHARE_READ,nullptr,OPEN_EXISTING,FILE_FLAG_OPEN_REPARSE_POINT,nullptr);
 if(file==INVALID_HANDLE_VALUE)return FilePaletteResult::unchanged;FilePaletteResult result=FilePaletteResult::unchanged;
 try{FILE_ID_INFO id{};LARGE_INTEGER before{};
  if(FileIdentity(file,path,id)&&CreatedHere(id)&&GetFileSizeEx(file,&before)&&before.QuadPart>1500000){
   std::vector<char> prefix(MaximumHeader(pins,count)+3);DWORD read=0;
   if(ReadFile(file,prefix.data(),static_cast<DWORD>(prefix.size()),&read,nullptr)){
    size_t bom=read>=3&&memcmp(prefix.data(),"\xef\xbb\xbf",3)==0?3:0;
    if(const auto* pin=MatchHeader(prefix.data()+bom,read-bom,pins,count)){
     std::string style=Style(*pin);LARGE_INTEGER position{};position.QuadPart=bom+pin->styleOffset;DWORD written=0;
     if(SetFilePointerEx(file,position,nullptr,FILE_BEGIN)){
      bool changed=WriteFile(file,style.data(),static_cast<DWORD>(style.size()),&written,nullptr)&&written==style.size();
      if(changed)result=FilePaletteResult::changed;
      else{DWORD restored=0;bool restore=SetFilePointerEx(file,position,nullptr,FILE_BEGIN)
       &&WriteFile(file,prefix.data()+position.QuadPart,static_cast<DWORD>(pin->styleLength),&restored,nullptr)&&restored==pin->styleLength;
       if(!restore){result=FilePaletteResult::restorationFailed;Wh_Log(L"Markdown temporary CSS restoration failed (%lu)",GetLastError());}}
     }
    }
   }
  }
 }catch(...){}CloseHandle(file);return result;
}
template<size_t Index> static HRESULT STDMETHODCALLTYPE NavigateHook(IUnknown* view,LPCWSTR uri){
 auto& boundary=boundaries[Index];
 if(enabled&&boundary.ready&&!HighContrast()&&IsCoreView(view)&&uri&&_wcsnicmp(uri,L"file:///",8)==0){
  try{wchar_t path[32768]{};DWORD length=32768;if(SUCCEEDED(PathCreateFromUrlW(uri,path,&length,0))
   &&PaletteFile(path)==FilePaletteResult::restorationFailed)return E_FAIL;}catch(...){}
 }
 // The original URI, Navigate call, resource filters and navigation handlers
 // remain unchanged. Only admitted CSS bytes in the host's own new temp file
 // can be written; CSP, document bytes and file length are never changed.
 return boundary.originalNavigate(view,uri);
}
template<size_t Index> static bool HookBoundary(HMODULE module){
 auto& boundary=boundaries[Index];const auto& pin=browserPins[Index];
 if(boundary.attempted)return boundary.module==module&&boundary.ready;
 boundary.module=module;boundary.attempted=true;
 auto base=reinterpret_cast<BYTE*>(module);
 // Each complete native-module digest has independently observed public COM
 // entry points and its own original calls. A second loaded runtime cannot
 // overwrite another runtime's trampoline or authorize an unknown module.
 bool ready=Wh_SetFunctionHook(base+pin.stringRva,reinterpret_cast<void*>(StringHook<Index>),reinterpret_cast<void**>(&boundary.originalString))
  &&Wh_SetFunctionHook(base+pin.navigateRva,reinterpret_cast<void*>(NavigateHook<Index>),reinterpret_cast<void**>(&boundary.originalNavigate));
 if(ready&&pin.backgroundGetterRva&&pin.backgroundSetterRva&&pin.closeRva){
  boundary.getBackground=reinterpret_cast<GetBackgroundFn>(base+pin.backgroundGetterRva);
  boundary.publicBackground=reinterpret_cast<SetBackgroundFn>(base+pin.backgroundSetterRva);
  ready=Wh_SetFunctionHook(base+pin.backgroundSetterRva,reinterpret_cast<void*>(BackgroundHook<Index>),reinterpret_cast<void**>(&boundary.originalBackground))
   &&Wh_SetFunctionHook(base+pin.closeRva,reinterpret_cast<void*>(BackgroundCloseHook<Index>),reinterpret_cast<void**>(&boundary.originalClose));
 }
 boundary.ready=ready;if(ready&&pin.backgroundSetterRva)UpdateBackgroundEnvironment(enabled.load()&&!HighContrast());return ready;
}
static bool InstallBoundary(HMODULE module){
 if(!module)return false;std::lock_guard lock(hookMutex);
 wchar_t path[32768]{};DWORD length=GetModuleFileNameW(module,path,32768);
 if(!length||length>=32768)return false;
 for(size_t index=0;index<std::size(browserPins);index++)if(DigestFile(path,browserPins[index].sha256))switch(index){
  case 0:return HookBoundary<0>(module);
  case 1:return HookBoundary<1>(module);
  case 2:return HookBoundary<2>(module);
 }
 return false;
}
static void ExistingBoundaries(){
 HANDLE snapshot=CreateToolhelp32Snapshot(TH32CS_SNAPMODULE,GetCurrentProcessId());if(snapshot==INVALID_HANDLE_VALUE)return;
 MODULEENTRY32W entry{sizeof(entry)};
 if(Module32FirstW(snapshot,&entry))do {
  if(_wcsicmp(entry.szModule,L"EmbeddedBrowserWebView.dll")==0)InstallBoundary(entry.hModule);
 }while(Module32NextW(snapshot,&entry));
 CloseHandle(snapshot);
}
static HMODULE WINAPI LoadHook(LPCWSTR path,HANDLE file,DWORD flags){
 HMODULE module=originalLoadLibraryEx(path,file,flags);DWORD error=GetLastError();
 if(module&&!(flags&(LOAD_LIBRARY_AS_DATAFILE|LOAD_LIBRARY_AS_IMAGE_RESOURCE|DONT_RESOLVE_DLL_REFERENCES))){
  try{wchar_t name[32768]{};DWORD length=GetModuleFileNameW(module,name,32768);
   if(length&&length<32768){const wchar_t* leaf=wcsrchr(name,L'\\');
    if(leaf&&_wcsicmp(leaf+1,L"EmbeddedBrowserWebView.dll")==0&&InstallBoundary(module))Wh_ApplyHookOperations();}
  }catch(...){}
 }SetLastError(error);return module;
}
BOOL Wh_ModInit(){
 wchar_t exe[32768]{};DWORD length=GetModuleFileNameW(nullptr,exe,32768);if(!length||length>=32768||HighContrast())return FALSE;
 std::wstring folder=exe;auto split=folder.find_last_of(L'\\');
 if(split==std::wstring::npos)return FALSE;
 if(_wcsicmp(folder.c_str()+split+1,L"prevhost.exe")==0)return InitNativePreviewHost(folder);
 if(_wcsicmp(folder.c_str()+split+1,L"PowerToys.MarkdownPreviewHandler.exe"))return FALSE;
 folder.resize(split);
 if(!DigestFile(exe,"d48704360aa8c8d5a3f572a055b176d50d58206f386cda49b2760beb3fd00cd9")||!DigestFile(folder+L"\\PowerToys.MarkdownPreviewHandler.dll","e47fcc38944ab5920aa49a31a2d0fef212865d1f5a62a65a08012a1767bed9cc")
  ||!DigestFile(folder+L"\\PowerToys.FilePreviewCommon.dll","35cb5f5e8e1d201d22db5d6b956195c04ae1a79469d36f25b90b6eeee6240ab7"))return FALSE;
 PWSTR low=nullptr;if(FAILED(SHGetKnownFolderPath(FOLDERID_LocalAppDataLow,0,nullptr,&low)))return FALSE;
 tempFolder=low;CoTaskMemFree(low);tempFolder+=L"\\Microsoft\\PowerToys\\MarkdownPreview-Temp\\";
 enabled=Wh_GetIntSetting(L"enabled")!=0;
 backgroundMessage=RegisterWindowMessageW(L"j3w1-powertoys-markdown-background");
 if(!backgroundMessage)return FALSE;
 ExistingBoundaries();
 bool ready=InitLoading()&&Wh_SetFunctionHook(reinterpret_cast<void*>(LoadLibraryExW),reinterpret_cast<void*>(LoadHook),reinterpret_cast<void**>(&originalLoadLibraryEx))
  &&Wh_SetFunctionHook(reinterpret_cast<void*>(CreateFileW),reinterpret_cast<void*>(CreateHook),reinterpret_cast<void**>(&originalCreateFile));
 if(!ready){enabled=false;RestoreBackgroundThreads();UpdateBackgroundEnvironment(false);}return ready;
}
void Wh_ModAfterInit(){if(nativePreviewMode)RefreshPreviewHosts();}
void Wh_ModBeforeUninit(){if(nativePreviewMode){enabled=false;RefreshPreviewHosts();}}
void Wh_ModSettingsChanged(){enabled=Wh_GetIntSetting(L"enabled")!=0;
 if(nativePreviewMode){RefreshPreviewHosts();return;}
 bool admitted=false;for(size_t i=0;i<std::size(browserPins);i++)admitted=admitted||(boundaries[i].ready&&browserPins[i].backgroundSetterRva);
 UpdateBackgroundEnvironment(enabled.load()&&admitted&&!HighContrast());if(!enabled.load())RestoreBackgroundThreads();}
void Wh_ModUninit(){enabled=false;if(nativePreviewMode){RefreshPreviewHosts();ReleasePreviewOwners();return;}RestoreBackgroundThreads();UpdateBackgroundEnvironment(false);std::lock_guard lock(filesMutex);createdFiles.clear();}
