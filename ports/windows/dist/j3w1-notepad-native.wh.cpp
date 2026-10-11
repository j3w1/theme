// ==WindhawkMod==
// @id j3w1-notepad-native
// @name j3w1 Notepad editor colors
// @description Package-gated editor painting; document formats remain native
// @version 1.1.1
// @author j3w1
// @include Notepad.exe
// @architecture x86-64
// @compilerOptions -ld2d1 -lbcrypt
// ==/WindhawkMod==
// ==WindhawkModSettings==
/*
- enabled: true
*/
// ==/WindhawkModSettings==
#include <windows.h>
#include <appmodel.h>
#include <richedit.h>
#include <bcrypt.h>
#include <d2d1.h>
#include <dwrite_2.h>
#include <atomic>
#include <vector>
#include <string>
#include <mutex>
#include <algorithm>
static constexpr COLORREF canvas=RGB(0,0,0),prose=RGB(233,148,153),selection=RGB(145,20,16),selectedText=RGB(244,238,238);
static const wchar_t* property=L"j3w1-notepad-native-owner";
static std::atomic<bool> enabled{false};
static UINT dispatch=0;
static thread_local bool editCall=false,internal=false;
static WNDPROC originalProc=nullptr;
static decltype(&GetSysColor) originalColor=nullptr;
using DrawGlyph=void(STDMETHODCALLTYPE*)(ID2D1RenderTarget*,D2D1_POINT_2F,DWRITE_GLYPH_RUN const*,ID2D1Brush*,DWRITE_MEASURING_MODE);
static DrawGlyph originalGlyph=nullptr;
struct Edit { HWND window=nullptr; COLORREF before=0; WPARAM system=0; bool applied=false; };
static std::vector<Edit*> edits;
static std::mutex stateMutex;
static bool HighContrast(){HIGHCONTRASTW value{sizeof(value)};return !SystemParametersInfoW(SPI_GETHIGHCONTRAST,sizeof(value),&value,0)||(value.dwFlags&HCF_HIGHCONTRASTON);}
static bool IsEdit(HWND window){wchar_t name[64]{};return GetClassNameW(window,name,64)&&wcscmp(name,L"RichEditD2DPT")==0;}
static Edit* Owned(HWND window){auto state=reinterpret_cast<Edit*>(GetPropW(window,property));return std::find(edits.begin(),edits.end(),state)!=edits.end()?state:nullptr;}
static void RefreshEdit(HWND window){
 std::lock_guard guard(stateMutex);auto state=Owned(window);
 bool active=enabled.load()&&!HighContrast();
 if(!active){if(state){internal=true;originalProc(window,EM_SETBKGNDCOLOR,state->system,state->before);internal=false;RemovePropW(window,property);edits.erase(std::remove(edits.begin(),edits.end(),state),edits.end());delete state;InvalidateRect(window,nullptr,FALSE);}return;}
 if(state)return;
 if(GetPropW(window,property))return;
 state=new Edit{window};if(!SetPropW(window,property,state)){delete state;return;}
 edits.push_back(state);internal=true;state->before=static_cast<COLORREF>(originalProc(window,EM_SETBKGNDCOLOR,0,canvas));internal=false;state->applied=true;
 InvalidateRect(window,nullptr,FALSE);
}
static LRESULT CALLBACK Proc(HWND window,UINT message,WPARAM wp,LPARAM lp){
 bool before=editCall;editCall=IsEdit(window);
 if(editCall&&!internal){
  if(message==dispatch&&lp==0){RefreshEdit(window);editCall=before;return 0;}
  if(message==WM_PAINT||message==WM_SETTINGCHANGE||message==WM_THEMECHANGED)RefreshEdit(window);
  if(message==EM_SETBKGNDCOLOR){std::lock_guard guard(stateMutex);if(auto state=Owned(window)){state->system=wp;state->before=static_cast<COLORREF>(lp);if(enabled.load()&&!HighContrast()){wp=0;lp=canvas;}}}
  if(message==WM_NCDESTROY){std::lock_guard guard(stateMutex);if(auto state=Owned(window)){RemovePropW(window,property);edits.erase(std::remove(edits.begin(),edits.end(),state),edits.end());delete state;}}
 }
 auto result=originalProc(window,message,wp,lp);editCall=before;return result;
}
static DWORD WINAPI Color(int index){
 if(editCall&&enabled.load()&&!HighContrast()){
  if(index==COLOR_WINDOWTEXT){return prose;}
  if(index==COLOR_WINDOW)return canvas;
  if(index==COLOR_HIGHLIGHT)return selection;
  if(index==COLOR_HIGHLIGHTTEXT)return selectedText;
 }
 return originalColor(index);
}
static void STDMETHODCALLTYPE Glyph(ID2D1RenderTarget* target,D2D1_POINT_2F point,DWRITE_GLYPH_RUN const* run,ID2D1Brush* brush,DWRITE_MEASURING_MODE measuring){
 if(editCall&&brush&&run&&enabled.load()&&!HighContrast()){
  bool colorFont=false;IDWriteFontFace2* face=nullptr;
  if(run->fontFace&&SUCCEEDED(run->fontFace->QueryInterface(IID_PPV_ARGS(&face)))){colorFont=face->IsColorFont();face->Release();}
  ID2D1SolidColorBrush* solid=nullptr;
  if(!colorFont&&SUCCEEDED(brush->QueryInterface(IID_PPV_ARGS(&solid)))){
   auto color=solid->GetColor();bool normal=color.r==1&&color.g==1&&color.b==1&&color.a==1;solid->Release();
   if(normal){ID2D1SolidColorBrush* replacement=nullptr;auto tint=D2D1::ColorF(GetRValue(prose)/255.0f,GetGValue(prose)/255.0f,GetBValue(prose)/255.0f,1);
    if(SUCCEEDED(target->CreateSolidColorBrush(tint,&replacement))){replacement->SetOpacity(brush->GetOpacity());D2D1_MATRIX_3X2_F transform;brush->GetTransform(&transform);replacement->SetTransform(transform);originalGlyph(target,point,run,replacement,measuring);replacement->Release();return;}
   }
  }
 }
 originalGlyph(target,point,run,brush,measuring);
}
static bool HookGlyph(){
 ID2D1Factory* factory=nullptr;ID2D1DCRenderTarget* target=nullptr;
 if(FAILED(D2D1CreateFactory(D2D1_FACTORY_TYPE_MULTI_THREADED,&factory)))return false;
 auto properties=D2D1::RenderTargetProperties(D2D1_RENDER_TARGET_TYPE_DEFAULT,D2D1::PixelFormat(DXGI_FORMAT_B8G8R8A8_UNORM,D2D1_ALPHA_MODE_IGNORE));
 bool result=false;if(SUCCEEDED(factory->CreateDCRenderTarget(&properties,&target))){auto function=(*reinterpret_cast<void***>(target))[29];result=Wh_SetFunctionHook(function,reinterpret_cast<void*>(Glyph),reinterpret_cast<void**>(&originalGlyph));target->Release();}
 factory->Release();return result;
}
static void RefreshAll(){
 EnumWindows([](HWND root,LPARAM)->BOOL{DWORD process=0;GetWindowThreadProcessId(root,&process);if(process!=GetCurrentProcessId())return TRUE;
  EnumChildWindows(root,[](HWND child,LPARAM)->BOOL{if(IsEdit(child))SendMessageW(child,dispatch,0,0);return TRUE;},0);return TRUE;
 },0);
}

static std::atomic<int> editorStatus{0};
static std::atomic<bool> ready{false};
static HANDLE stopDiscovery=nullptr;
// Cancel and join on unload; process exit has no thread-object destructor.
static HANDLE discovery=nullptr;
static bool ReviewedEditor(){
    if(int status=editorStatus.load())return status==1;
    auto module=GetModuleHandleW(L"riched20.dll");if(!module)return false;
    wchar_t path[32768]{};DWORD length=GetModuleFileNameW(module,path,std::size(path));
    if(!length||length>=std::size(path))return false;
    std::wstring name=path;
    if(name.find(L"\\Notepad\\riched20.dll")==std::wstring::npos){editorStatus=-1;return false;}
    HANDLE file=CreateFileW(path,GENERIC_READ,FILE_SHARE_READ,nullptr,OPEN_EXISTING,FILE_ATTRIBUTE_NORMAL,nullptr);
    if(file==INVALID_HANDLE_VALUE)return false;
    BCRYPT_ALG_HANDLE algorithm=nullptr;BCRYPT_HASH_HANDLE hash=nullptr;
    DWORD size=0,written=0;std::vector<BYTE> object;BYTE digest[32]{};bool valid=false;
    if(BCryptOpenAlgorithmProvider(&algorithm,BCRYPT_SHA256_ALGORITHM,nullptr,0)>=0
       &&BCryptGetProperty(algorithm,BCRYPT_OBJECT_LENGTH,reinterpret_cast<PUCHAR>(&size),sizeof(size),&written,0)>=0){
        object.resize(size);
        if(BCryptCreateHash(algorithm,&hash,object.data(),size,nullptr,0,0)>=0){
            BYTE buffer[65536];DWORD count=0;bool complete=false;
            for(;;){if(!ReadFile(file,buffer,sizeof(buffer),&count,nullptr))break;
                if(!count){complete=true;break;}if(BCryptHashData(hash,buffer,count,0)<0)break;}
            if(complete&&BCryptFinishHash(hash,digest,sizeof(digest),0)>=0){
                constexpr char hex[]="0123456789abcdef";std::string actual;
                for(BYTE byte:digest){actual+=hex[byte>>4];actual+=hex[byte&15];}
                valid=actual=="e7babd9942e133c690b4144657956af890912d130f81a81650f3a5597b5e5dbc";
            }
        }
    }
    if(hash)BCryptDestroyHash(hash);if(algorithm)BCryptCloseAlgorithmProvider(algorithm,0);CloseHandle(file);
    editorStatus=valid?1:-1;return valid;
}

static void AdmitEditor() {
 if(ready.load()||!ReviewedEditor())return;
 auto module=GetModuleHandleW(L"riched20.dll");
 WNDCLASSEXW info{sizeof(info)};
 bool found=GetClassInfoExW(module,L"RichEditD2DPT",&info)
     ||GetClassInfoExW(nullptr,L"RichEditD2DPT",&info)
     ||GetClassInfoExW(GetModuleHandleW(nullptr),L"RichEditD2DPT",&info);
 if(!found)return;
 HMODULE owner=nullptr;
 if(!GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS|GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,
     reinterpret_cast<LPCWSTR>(info.lpfnWndProc),&owner)||owner!=module)return;
 if(Wh_SetFunctionHook(reinterpret_cast<void*>(info.lpfnWndProc),reinterpret_cast<void*>(Proc),
     reinterpret_cast<void**>(&originalProc))&&Wh_ApplyHookOperations()) {
  ready=true;RefreshAll();
 }
}
static void StopDiscovery() {
 if(stopDiscovery)SetEvent(stopDiscovery);
 if(discovery){WaitForSingleObject(discovery,INFINITE);CloseHandle(discovery);discovery=nullptr;}
 if(stopDiscovery){CloseHandle(stopDiscovery);stopDiscovery=nullptr;}
}
static void StartDiscovery() {
 StopDiscovery();if(!enabled.load()||ready.load())return;
 stopDiscovery=CreateEventW(nullptr,TRUE,FALSE,nullptr);if(!stopDiscovery)return;
 discovery=CreateThread(nullptr,0,[](LPVOID)->DWORD {
  try{for(unsigned i=0;i<100&&!ready.load()&&WaitForSingleObject(stopDiscovery,100)==WAIT_TIMEOUT;i++)AdmitEditor();}catch(...){}
  return 0;
 },nullptr,0,nullptr);
 if(!discovery){CloseHandle(stopDiscovery);stopDiscovery=nullptr;}
}
BOOL Wh_ModInit(){
 UINT32 length=0;GetCurrentPackageFullName(&length,nullptr);if(!length||length>512)return FALSE;
 std::vector<wchar_t> name(length);if(GetCurrentPackageFullName(&length,name.data())!=ERROR_SUCCESS||wcscmp(name.data(),L"Microsoft.WindowsNotepad_11.2607.14.0_x64__8wekyb3d8bbwe"))return FALSE;
 dispatch=RegisterWindowMessageW(L"j3w1-notepad-native-refresh");enabled=Wh_GetIntSetting(L"enabled")!=0;
 return dispatch&&Wh_SetFunctionHook(reinterpret_cast<void*>(GetSysColor),reinterpret_cast<void*>(Color),
     reinterpret_cast<void**>(&originalColor))&&HookGlyph();
}
void Wh_ModAfterInit(){AdmitEditor();StartDiscovery();}
void Wh_ModSettingsChanged(){enabled=false;StopDiscovery();if(ready.load())RefreshAll();enabled=Wh_GetIntSetting(L"enabled")!=0;if(ready.load())RefreshAll();StartDiscovery();}
void Wh_ModUninit(){enabled=false;StopDiscovery();if(ready.load())RefreshAll();}
