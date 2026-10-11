// Hidden synthetic windows and mocked DWM attributes; no desktop input/capture.
#include <windows.h>
#include <dwmapi.h>
#include <cassert>
#include <cstdio>
#include <map>
static bool fixtureHighContrast=false;
static BOOL WINAPI FixtureSystemParametersInfo(UINT action,UINT size,PVOID value,UINT flags){
 if(action==SPI_GETHIGHCONTRAST){static_cast<HIGHCONTRASTW*>(value)->dwFlags=fixtureHighContrast?HCF_HIGHCONTRASTON:0;return TRUE;}
 return SystemParametersInfoW(action,size,value,flags);
}
static std::map<std::pair<HWND,DWORD>,DWORD> attributes;
static DWORD failAttribute=0;
static HRESULT WINAPI FixtureDwmSet(HWND window,DWORD attribute,LPCVOID value,DWORD size){
 if(attribute==failAttribute)return E_FAIL;
 if(!value || size!=sizeof(DWORD))return E_INVALIDARG;
 attributes[{window,attribute}]=*static_cast<const DWORD*>(value);return S_OK;
}
static HRESULT WINAPI FixtureDwmGet(HWND window,DWORD attribute,PVOID value,DWORD size){
 assert(attribute==DWMWA_SYSTEMBACKDROP_TYPE && size==sizeof(DWORD));
 *static_cast<DWORD*>(value)=attributes[{window,attribute}];return S_OK;
}
#define SystemParametersInfoW FixtureSystemParametersInfo
#define DwmSetWindowAttribute FixtureDwmSet
#define DwmGetWindowAttribute FixtureDwmGet
static BOOL Wh_SetFunctionHook(void*,void*,void**){return TRUE;}
static PCWSTR Wh_GetStringSetting(PCWSTR){return L"#000000";}
static void Wh_FreeStringSetting(PCWSTR){}
#include "windows-windhawk-symbol-stubs.h"
#include "../ports/windows/dist/j3w1-explorer-native.wh.cpp"
static HWND Window(PCWSTR name,HWND parent=nullptr){
 WNDCLASSW c{};c.lpfnWndProc=DefWindowProcW;c.hInstance=GetModuleHandleW(nullptr);c.lpszClassName=name;
 RegisterClassW(&c);
 HWND window=CreateWindowExW(0,name,L"",parent?WS_CHILD:WS_OVERLAPPEDWINDOW,0,0,32,32,parent,nullptr,c.hInstance,nullptr);
 assert(window);return window;
}
static DWORD Value(HWND window,DWORD attribute){return attributes[{window,attribute}];}
int main(){
 originalDwmSetWindowAttribute=FixtureDwmSet;originalCreateWindowEx=CreateWindowExW;originalDestroyWindow=DestroyWindow;
 background=RGB(0,0,0);foreground=RGB(233,148,153);enabled=true;
 HWND explorer=Window(L"CabinetWClass"),other=Window(L"J3w1OtherApplication"),child=Window(L"CabinetWClass",other);
 attributes[{explorer,DWMWA_SYSTEMBACKDROP_TYPE}]=DWMSBT_TABBEDWINDOW;
 RefreshCaption(other);RefreshCaption(child);assert(captionStates.empty());
 RefreshCaption(explorer);assert(captionStates.size()==1);
 assert(Value(explorer,DWMWA_CAPTION_COLOR)==background && Value(explorer,DWMWA_TEXT_COLOR)==foreground);
 assert(Value(explorer,DWMWA_SYSTEMBACKDROP_TYPE)==DWMSBT_NONE);
 const LONG_PTR style=GetWindowLongPtrW(explorer,GWL_STYLE);
 RefreshCaption(explorer);assert(captionStates.size()==1 && GetWindowLongPtrW(explorer,GWL_STYLE)==style);
 DWORD requested=RGB(1,2,3);
 assert(DwmAttributeHook(other,DWMWA_TEXT_COLOR,&requested,sizeof(requested))==S_OK);
 assert(Value(other,DWMWA_TEXT_COLOR)==requested);
 assert(DwmAttributeHook(explorer,DWMWA_TEXT_COLOR,&requested,sizeof(requested))==S_OK);
 assert(Value(explorer,DWMWA_TEXT_COLOR)==foreground);
 DWORD caption=RGB(4,5,6),backdrop=DWMSBT_MAINWINDOW;
 assert(DwmAttributeHook(explorer,DWMWA_CAPTION_COLOR,&caption,sizeof(caption))==S_OK);
 assert(DwmAttributeHook(explorer,DWMWA_SYSTEMBACKDROP_TYPE,&backdrop,sizeof(backdrop))==S_OK);
 assert(DwmAttributeHook(explorer,DWMWA_BORDER_COLOR,&requested,sizeof(requested))==S_OK);
 assert(Value(explorer,DWMWA_BORDER_COLOR)==requested);
 failAttribute=DWMWA_TEXT_COLOR;DWORD rejected=RGB(7,8,9);
 assert(DwmAttributeHook(explorer,DWMWA_TEXT_COLOR,&rejected,sizeof(rejected))==E_FAIL);failAttribute=0;
 RestoreCaptions();assert(captionStates.empty() && !GetPropW(explorer,captionProperty));
 assert(Value(explorer,DWMWA_TEXT_COLOR)==requested && Value(explorer,DWMWA_CAPTION_COLOR)==caption);
 assert(Value(explorer,DWMWA_SYSTEMBACKDROP_TYPE)==backdrop);
 RefreshCaption(explorer);fixtureHighContrast=true;RefreshCaption(explorer);
 assert(captionStates.empty() && Value(explorer,DWMWA_CAPTION_COLOR)==DWMWA_COLOR_DEFAULT);
 fixtureHighContrast=false;RefreshCaption(explorer);
 fixtureHighContrast=true;
 assert(DwmAttributeHook(explorer,DWMWA_TEXT_COLOR,&requested,sizeof(requested))==S_OK);
 assert(captionStates.empty() && Value(explorer,DWMWA_TEXT_COLOR)==requested);fixtureHighContrast=false;
 failAttribute=DWMWA_TEXT_COLOR;RefreshCaption(explorer);assert(captionStates.empty());failAttribute=0;
 RefreshCaption(explorer);Wh_ModBeforeUninit();assert(captionStates.empty() && !enabled.load());
 RefreshCaption(explorer);assert(captionStates.empty());enabled=true;
 HWND created=CreateWindowHook(0,L"CabinetWClass",L"",WS_OVERLAPPEDWINDOW,0,0,40,40,nullptr,nullptr,GetModuleHandleW(nullptr),nullptr);
 assert(created && captionStates.size()==1 && Value(created,DWMWA_CAPTION_COLOR)==background);
 assert(DestroyWindowHook(created) && captionStates.empty());
 SetPropW(explorer,captionProperty,(HANDLE)1);RefreshCaption(explorer);
 // An unrelated property must never be interpreted as one of our allocations.
 assert(GetPropW(explorer,captionProperty)==(HANDLE)1 && captionStates.empty());RemovePropW(explorer,captionProperty);
 DestroyWindow(explorer);DestroyWindow(child);DestroyWindow(other);
 puts("PASS: native black/rose captions; exact owner and root admission; unchanged window controls/styles; app-request restoration, failure passthrough, new-window lifecycle, high contrast and unload");
}
