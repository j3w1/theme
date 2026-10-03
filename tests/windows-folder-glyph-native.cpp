// Hidden native controls and stock/synthetic glyphs only; no desktop input.
#include <windows.h>
#include <shellapi.h>
#include <shlobj.h>
#include <commoncontrols.h>
#include <cassert>
#include <cstdio>
static HWND fixtureOwner;
static bool fixtureContrast=false;
static unsigned stockQueries=0,extendedCalls=0;
static constexpr unsigned long long extension=0x57444F5241570001ull;
static BOOL WINAPI FixtureGui(DWORD,GUITHREADINFO* value){value->hwndActive=fixtureOwner;return TRUE;}
static BOOL WINAPI FixtureParameters(UINT action,UINT size,PVOID value,UINT flags){if(action==SPI_GETHIGHCONTRAST){static_cast<HIGHCONTRASTW*>(value)->dwFlags=fixtureContrast?HCF_HIGHCONTRASTON:0;return TRUE;}return SystemParametersInfoW(action,size,value,flags);}
static HRESULT WINAPI FixtureStock(SHSTOCKICONID id,UINT flags,SHSTOCKICONINFO* value){++stockQueries;return SHGetStockIconInfo(id,flags,value);}
static void Extended(IMAGELISTDRAWPARAMS* value){if(value->cbSize==96){unsigned long long tail=0;memcpy(&tail,reinterpret_cast<BYTE*>(value)+88,8);assert(tail==extension);++extendedCalls;}}
static BOOL WINAPI FixtureDraw(IMAGELISTDRAWPARAMS* request){Extended(request);auto standard=*request;standard.cbSize=sizeof(standard);return ImageList_DrawIndirect(&standard);}
#define GetGUIThreadInfo FixtureGui
#define SystemParametersInfoW FixtureParameters
#define SHGetStockIconInfo FixtureStock
#define ImageList_DrawIndirect FixtureDraw
static BOOL Wh_SetFunctionHook(void*,void*,void**){return TRUE;}
static PCWSTR Wh_GetStringSetting(PCWSTR){return L"#000000";}
static void Wh_FreeStringSetting(PCWSTR){}
#include "windows-windhawk-symbol-stubs.h"
#include "../ports/windows/dist/j3w1-explorer-native.wh.cpp"
static HWND Window(PCWSTR name){WNDCLASSW type{};type.lpfnWndProc=DefWindowProcW;type.hInstance=GetModuleHandleW(nullptr);type.lpszClassName=name;assert(RegisterClassW(&type)||GetLastError()==ERROR_CLASS_ALREADY_EXISTS);auto window=CreateWindowExW(0,name,L"",0,0,0,32,32,nullptr,nullptr,type.hInstance,nullptr);assert(window);return window;}
int main(int argc,char** argv){
 assert(SUCCEEDED(CoInitializeEx(nullptr,COINIT_APARTMENTTHREADED)));
 const COLORREF fill=RGB(125,19,16),edge=RGB(229,57,53);
 assert(FolderGlyph::Build(fill,edge));assert(FolderGlyph::frames.size()==13);
 HWND explorer=Window(L"CabinetWClass"),unrelated=Window(L"OtherApplication");fixtureOwner=explorer;
 enabled=true;imageListSize=&ImageList_GetIconSize;
 originalImageListDraw=[](void* self,IMAGELISTDRAWPARAMS* request)->HRESULT{Extended(request);auto standard=*request;standard.cbSize=sizeof(standard);return self?static_cast<IImageList*>(self)->Draw(&standard):ImageList_DrawIndirect(&standard)?S_OK:E_FAIL;};
 IImageList* stock=nullptr;assert(SUCCEEDED(SHGetImageList(SHIL_SMALL,__uuidof(IImageList),reinterpret_cast<void**>(&stock))));
 SHSTOCKICONINFO stockInfo{sizeof(stockInfo)};assert(SUCCEEDED(SHGetStockIconInfo(SIID_FOLDER,SHGSI_SYSICONINDEX,&stockInfo)));
 for(int size:{16,24,32,48,144,256}) {
  HDC dc=CreateCompatibleDC(nullptr);DWORD* pixels=nullptr;HBITMAP bitmap=FolderGlyph::Bitmap(size,&pixels);assert(dc&&bitmap);auto prior=SelectObject(dc,bitmap);
  alignas(IMAGELISTDRAWPARAMS) BYTE bytes[96]{};auto& request=*reinterpret_cast<IMAGELISTDRAWPARAMS*>(bytes);request.cbSize=sizeof(request);request.himl=reinterpret_cast<HIMAGELIST>(stock);request.i=stockInfo.iSysImageIndex;request.hdcDst=dc;request.cx=request.cy=size;request.rgbBk=CLR_NONE;request.rgbFg=CLR_DEFAULT;request.fStyle=ILD_TRANSPARENT|ILD_SCALE;
  auto draw=[&](bool hook){std::fill_n(pixels,size*size,0u);assert(SUCCEEDED(hook?NavigationPinHook(stock,&request):originalImageListDraw(stock,&request)));GdiFlush();return std::vector<DWORD>(pixels,pixels+size*size);};
  auto native=draw(false),themed=draw(true);assert(native!=themed);
  stockQueries=0;for(unsigned n=0;n<20;n++)assert(draw(true)==themed);assert(stockQueries==0);
  request.cbSize=96;memcpy(bytes+88,&extension,8);assert(draw(true)==themed);assert(extendedCalls>0);
  request.cbSize=104;assert(draw(true)==native);request.cbSize=sizeof(request);
  fixtureContrast=true;assert(draw(true)==native);fixtureContrast=false;
  fixtureOwner=unrelated;assert(draw(true)==native);fixtureOwner=explorer;
  enabled=false;assert(draw(true)==native);enabled=true;
  // Overlay and cropped operations are passed to the unmodified native draw.
  request.fStyle|=INDEXTOOVERLAYMASK(1);assert(draw(true)==draw(false));request.fStyle=ILD_TRANSPARENT|ILD_SCALE;
  request.xBitmap=1;assert(draw(true)==draw(false));request.xBitmap=0;
  if(size==24){int width=0,height=0;assert(ImageList_GetIconSize(request.himl,&width,&height));assert(width==height);
   if(width==size){request.cx=request.cy=0;assert(draw(true)==themed);request.cx=request.cy=size;}
  }
  // Persist only generated artwork for a byte comparison with original ICO frames.
  if(argc==2&&size==24){std::vector<DWORD> raster(size*size);FolderGlyph::Raster(raster.data(),size,false,fill,edge);FILE* file=fopen(argv[1],"wb");assert(file);assert(fwrite(raster.data(),4,raster.size(),file)==raster.size());fclose(file);}
  SelectObject(dc,prior);DeleteObject(bitmap);DeleteDC(dc);
 }
 // A custom source must retain its native rendering.
 int width=0,height=0;assert(stock->GetIconSize(&width,&height)==S_OK);
 HIMAGELIST images=ImageList_Create(width,height,ILC_COLOR32|ILC_MASK,1,0);assert(images);
 DWORD* sourcePixels=nullptr;HBITMAP source=FolderGlyph::Bitmap(width,&sourcePixels);assert(source);std::fill_n(sourcePixels,width*height,0xff14dc32u);assert(ImageList_Add(images,source,nullptr)==0);DeleteObject(source);
 HDC dc=CreateCompatibleDC(nullptr);DWORD* pixels=nullptr;HBITMAP bitmap=FolderGlyph::Bitmap(width,&pixels);auto prior=SelectObject(dc,bitmap);
 IMAGELISTDRAWPARAMS draw{sizeof(draw)};draw.himl=images;draw.i=0;draw.hdcDst=dc;draw.cx=draw.cy=width;draw.rgbBk=CLR_NONE;draw.rgbFg=CLR_DEFAULT;draw.fStyle=ILD_TRANSPARENT|ILD_SCALE;
 memset(pixels,0,width*height*4);assert(SUCCEEDED(NavigationPinHook(nullptr,&draw)));GdiFlush();std::vector<DWORD> actual(pixels,pixels+width*height);
 memset(pixels,0,width*height*4);assert(SUCCEEDED(originalImageListDraw(nullptr,&draw)));GdiFlush();assert(actual==std::vector<DWORD>(pixels,pixels+width*height));
 // Acquisition has a separate raster identity and retains caller ownership.
 originalImageListGetIcon=&ImageList_GetIcon;
 auto iconPixels=[](HICON icon){int size=FolderGlyph::IconSize(icon);assert(size>0);DWORD* pixels=nullptr;auto bitmap=FolderGlyph::Bitmap(size,&pixels);HDC buffer=CreateCompatibleDC(nullptr);assert(bitmap&&buffer);auto before=SelectObject(buffer,bitmap);memset(pixels,0,size*size*4);assert(DrawIconEx(buffer,0,0,icon,size,size,0,nullptr,DI_NORMAL));GdiFlush();std::vector<DWORD> copy(pixels,pixels+size*size);SecureZeroMemory(pixels,size*size*4);SelectObject(buffer,before);DeleteDC(buffer);DeleteObject(bitmap);return copy;};
 for(unsigned open=0;open<2;open++) {
  SHSTOCKICONINFO identity{sizeof(identity)};assert(SUCCEEDED(SHGetStockIconInfo(open?SIID_FOLDEROPEN:SIID_FOLDER,SHGSI_SYSICONINDEX,&identity)));
  HICON native=nullptr;assert(SUCCEEDED(stock->GetIcon(identity.iSysImageIndex,ILD_NORMAL,&native))&&native);auto baselinePixels=iconPixels(native);int size=FolderGlyph::IconSize(native);
  stockQueries=0;HICON themed=FolderGlyph::Acquire(native,ILD_NORMAL,true);assert(themed&&iconPixels(themed)!=baselinePixels&&FolderGlyph::IconSize(themed)==size);assert(stockQueries==0);DestroyIcon(themed);
  // Acquiring the themed icon did not alter the original shell list.
  assert(SUCCEEDED(stock->GetIcon(identity.iSysImageIndex,ILD_NORMAL,&native))&&native);assert(iconPixels(native)==baselinePixels);
  assert(FolderGlyph::Acquire(native,ILD_NORMAL,false)==native);
  fixtureContrast=true;assert(FolderGlyph::Acquire(native,ILD_NORMAL,true)==native);fixtureContrast=false;
  fixtureOwner=unrelated;assert(FolderGlyph::Acquire(native,ILD_NORMAL,true)==native);fixtureOwner=explorer;
  enabled=false;assert(FolderGlyph::Acquire(native,ILD_NORMAL,true)==native);enabled=true;
  assert(FolderGlyph::Acquire(native,INDEXTOOVERLAYMASK(1),true)==native);
  auto originalGetIcon=originalImageListGetIcon;originalImageListGetIcon=[](HIMAGELIST,int,UINT)->HICON{return nullptr;};assert(FolderGlyph::Acquire(native,ILD_NORMAL,true)==native);originalImageListGetIcon=originalGetIcon;
  // The same list slot stops matching after a customized glyph replaces it.
  IImageList* mutableList=nullptr;assert(SUCCEEDED(stock->Clone(__uuidof(IImageList),reinterpret_cast<void**>(&mutableList)))&&mutableList);DestroyIcon(native);
  HICON acquired=nullptr;assert(SUCCEEDED(mutableList->GetIcon(identity.iSysImageIndex,ILD_NORMAL,&acquired))&&acquired);auto genericPixels=iconPixels(acquired);assert(genericPixels==baselinePixels);HICON changed=FolderGlyph::Acquire(acquired,ILD_NORMAL,true);assert(iconPixels(changed)!=genericPixels);DestroyIcon(changed);
  DWORD* customPixels=nullptr;HBITMAP custom=FolderGlyph::Bitmap(size,&customPixels);assert(custom);std::fill_n(customPixels,size*size,0xff14dc32u);assert(SUCCEEDED(mutableList->Replace(identity.iSysImageIndex,custom,nullptr)));DeleteObject(custom);
  assert(SUCCEEDED(mutableList->GetIcon(identity.iSysImageIndex,ILD_NORMAL,&acquired))&&acquired);assert(FolderGlyph::Acquire(acquired,ILD_NORMAL,true)==acquired);DestroyIcon(acquired);mutableList->Release();
  DWORD objects=GetGuiResources(GetCurrentProcess(),GR_USEROBJECTS),gdi=GetGuiResources(GetCurrentProcess(),GR_GDIOBJECTS);
  for(unsigned n=0;n<24;n++){assert(SUCCEEDED(stock->GetIcon(identity.iSysImageIndex,ILD_NORMAL,&native))&&native);themed=FolderGlyph::Acquire(native,ILD_NORMAL,true);assert(themed);DestroyIcon(themed);}
  assert(GetGuiResources(GetCurrentProcess(),GR_USEROBJECTS)==objects&&GetGuiResources(GetCurrentProcess(),GR_GDIOBJECTS)==gdi);
 }

 ImageList_Destroy(images);SelectObject(dc,prior);DeleteObject(bitmap);DeleteDC(dc);stock->Release();enabled=false;FolderGlyph::Uninit();assert(FolderGlyph::frames.empty());
 DWORD baseline=GetGuiResources(GetCurrentProcess(),GR_GDIOBJECTS);
 for(unsigned cycle=0;cycle<3;cycle++){assert(FolderGlyph::Build(fill,edge));FolderGlyph::Uninit();assert(GetGuiResources(GetCurrentProcess(),GR_GDIOBJECTS)==baseline);}
 DestroyWindow(explorer);DestroyWindow(unrelated);CoUninitialize();puts("PASS: exact stock replacement at six sizes, extended-request preservation, unknown/overlay/crop/contrast/window fallback, custom glyph preservation, no paint shell queries, caller-owned generic acquisition, current-slot custom preservation and stable cache cleanup");
}
