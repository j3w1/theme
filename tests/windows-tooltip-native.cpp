// Hidden tooltip windows and offscreen theme painting; no input or label reads.
#include <windows.h>
#include <cassert>
#include <cstdio>
static bool contrast=false;
static BOOL WINAPI TestContrast(UINT action,UINT size,PVOID value,UINT flags) {
 if(action==SPI_GETHIGHCONTRAST){static_cast<HIGHCONTRASTW*>(value)->dwFlags=contrast?HCF_HIGHCONTRASTON:0;return TRUE;}
 return SystemParametersInfoW(action,size,value,flags);
}
#define SystemParametersInfoW TestContrast
static BOOL Wh_SetFunctionHook(void*,void*,void**){return TRUE;}
static PCWSTR Wh_GetStringSetting(PCWSTR){return L"#000000";}
static void Wh_FreeStringSetting(PCWSTR){}
#include "windows-windhawk-symbol-stubs.h"
#include "../ports/windows/dist/j3w1-explorer-native.wh.cpp"
static HWND currentTool=nullptr;
static LRESULT CALLBACK TooltipProc(HWND window,UINT message,WPARAM wParam,LPARAM lParam) {
 if(message==TTM_GETCURRENTTOOLW) {
  if(!currentTool)return 0;auto info=reinterpret_cast<TOOLINFOW*>(lParam);
  assert(info&&info->cbSize==sizeof(TOOLINFOW));info->hwnd=currentTool;return 1;
 }
 return DefWindowProcW(window,message,wParam,lParam);
}
static HWND Window(PCWSTR name,HWND owner=nullptr) {
 WNDCLASSW type{};type.lpfnWndProc=_wcsicmp(name,L"tooltips_class32")==0?TooltipProc:DefWindowProcW;
 type.hInstance=GetModuleHandleW(nullptr);type.lpszClassName=name;
 assert(RegisterClassW(&type)||GetLastError()==ERROR_CLASS_ALREADY_EXISTS);
 auto window=CreateWindowExW(0,name,L"",WS_POPUP,0,0,32,32,owner,nullptr,type.hInstance,nullptr);assert(window);return window;
}
int main() {
 auto folder=Window(L"CabinetWClass"),other=Window(L"OtherApplication");
 auto tooltip=Window(L"tooltips_class32",folder),unrelated=Window(L"tooltips_class32",other),detached=Window(L"tooltips_class32");
 enabled=true;background=RGB(0,0,0);foreground=RGB(233,148,153);menuBorder=RGB(125,19,16);
 assert(ExplorerTooltip(tooltip)&&!ExplorerTooltip(unrelated)&&!ExplorerTooltip(detached));
 currentTool=folder;assert(ExplorerTooltip(detached));currentTool=other;assert(!ExplorerTooltip(detached));currentTool=nullptr;
 HDC dc=CreateCompatibleDC(nullptr);BITMAPINFO info{};info.bmiHeader.biSize=sizeof(info.bmiHeader);
 info.bmiHeader.biWidth=32;info.bmiHeader.biHeight=-32;info.bmiHeader.biPlanes=1;info.bmiHeader.biBitCount=32;
 void* pixels=nullptr;auto bitmap=CreateDIBSection(dc,&info,DIB_RGB_COLORS,&pixels,nullptr,0);assert(bitmap);
 auto previous=SelectObject(dc,bitmap);RECT rect{0,0,32,32},clip{0,0,16,32};
 themeClass=[](HTHEME,LPWSTR name,int count)->HRESULT{wcscpy_s(name,count,L"DarkMode_Explorer::Tooltip");return S_OK;};
 originalDrawThemeBackground=[](HTHEME,HDC target,int,int,const RECT* area,const RECT*)->HRESULT {
  auto gray=CreateSolidBrush(RGB(48,48,48));FillRect(target,area,gray);DeleteObject(gray);
  auto edge=CreateSolidBrush(RGB(128,128,128));FrameRect(target,area,edge);DeleteObject(edge);return S_OK;
 };
 originalGetThemeColor=[](HTHEME,int,int,int,COLORREF* value)->HRESULT{*value=RGB(224,224,224);return S_OK;};
 originalDrawThemeTextEx=[](HTHEME,HDC,int part,int state,LPCWSTR text,int count,DWORD flags,LPRECT area,const DTTOPTS* options)->HRESULT {
  assert(part==TTP_STANDARD&&state==TTSS_NORMAL&&text==nullptr&&count==0&&flags==DT_LEFT&&area);
  assert(options&&(options->dwFlags&DTT_TEXTCOLOR)&&options->crText==foreground);return S_OK;
 };
 assert(TooltipPart(nullptr,TTP_STANDARD,TTSS_NORMAL)&&!TooltipPart(nullptr,TTP_BALLOON,TTBS_NORMAL));
 paintWindows.push_back(tooltip);assert(TooltipDC(dc));
 assert(SUCCEEDED(BackgroundHook(nullptr,dc,TTP_STANDARD,TTSS_NORMAL,&rect,&clip)));
 assert(GetPixel(dc,8,8)==background&&GetPixel(dc,0,8)==menuBorder&&GetPixel(dc,20,8)==RGB(0,0,0));
 COLORREF color=0;assert(SUCCEEDED(ThemeColorHook(nullptr,TTP_STANDARD,TTSS_NORMAL,TMT_FILLCOLOR,&color))&&color==background);
 assert(SUCCEEDED(ThemeColorHook(nullptr,TTP_STANDARD,TTSS_NORMAL,TMT_TEXTCOLOR,&color))&&color==foreground);
 assert(SUCCEEDED(TextExHook(nullptr,dc,TTP_STANDARD,TTSS_NORMAL,nullptr,0,DT_LEFT,&rect,nullptr)));
 paintWindows.back()=unrelated;assert(!TooltipDC(dc));
 assert(SUCCEEDED(BackgroundHook(nullptr,dc,TTP_STANDARD,TTSS_NORMAL,&rect,nullptr))&&GetPixel(dc,8,8)==RGB(48,48,48));
 paintWindows.back()=tooltip;enabled=false;assert(!TooltipDC(dc));enabled=true;contrast=true;assert(!TooltipDC(dc));contrast=false;
 drawingTheme=true;assert(!TooltipDC(dc));drawingTheme=false;paintWindows.clear();assert(!TooltipDC(dc));
 {DefaultPaintScope scope(tooltip);assert(TooltipDC(dc));}assert(!TooltipDC(dc));
 SelectObject(dc,previous);DeleteObject(bitmap);DeleteDC(dc);
 for(auto window:{detached,unrelated,tooltip,other,folder})DestroyWindow(window);
 puts("PASS: Explorer tooltip ownership, offscreen surface/frame/text, clipping, nested scopes, high contrast and native passthrough");
}
