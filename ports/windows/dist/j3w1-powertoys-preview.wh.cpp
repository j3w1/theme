// ==WindhawkMod==
// @id j3w1-powertoys-preview
// @name j3w1 PowerToys text preview
// @description Token palette for the exact reviewed Monaco preview template
// @version 1.0
// @author j3w1
// @include PowerToys.MonacoPreviewHandler.exe
// @architecture x86-64
// @compilerOptions -lbcrypt -lversion -luser32 -lshell32 -lole32 -luuid -lgdi32 -luxtheme
// ==/WindhawkMod==
// ==WindhawkModSettings==
/*
- enabled: true
*/
// ==/WindhawkModSettings==
#include <windows.h>
#include <bcrypt.h>
#include <shlobj.h>
#include <uxtheme.h>
#include <vsstyle.h>
#include <string>
#include <vector>
#include <atomic>

static decltype(&CreateFileW) originalCreateFile;
static std::wstring templatePath;
static std::atomic<bool> enabled{false};
static thread_local bool redirecting=false;
static decltype(&FillRect) originalFillRect;
static decltype(&SetTextColor) originalSetTextColor;
static decltype(&SetBkColor) originalSetBkColor;
static decltype(&BeginPaint) originalBeginPaint;
static decltype(&EndPaint) originalEndPaint;
static thread_local std::vector<HWND> paintWindows;
static constexpr COLORREF loadingBackground=RGB(0,0,0);
static constexpr COLORREF loadingForeground=RGB(233,148,153);
static constexpr COLORREF progressTrack=RGB(66,15,12);
static constexpr COLORREF progressFill=RGB(125,19,16);
static constexpr COLORREF progressBorder=RGB(163,103,107);
static decltype(&DrawThemeBackground) originalProgressBackground;
using ThemeClassFn=HRESULT(WINAPI*)(HTHEME,LPWSTR,int);
static ThemeClassFn themeClass;
static thread_local bool paintingProgress=false;

static bool HighContrast() {
    HIGHCONTRASTW value{sizeof(value)};
    return !SystemParametersInfoW(SPI_GETHIGHCONTRAST,sizeof(value),&value,0)
        || (value.dwFlags&HCF_HIGHCONTRASTON);
}
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
static bool ProgressDC(HDC dc) {
    if(!enabled.load() || paintingProgress || HighContrast())return false;
    HWND owner=WindowFromDC(dc);
    HWND window=owner?owner:paintWindows.empty()?nullptr:paintWindows.back();
    DWORD process=0;wchar_t name[128]{};
    if(!window || !GetWindowThreadProcessId(window,&process) || process!=GetCurrentProcessId()
        || !GetClassNameW(window,name,128))return false;
    constexpr wchar_t prefix[]=L"WindowsForms10.msctls_progress32.";
    return _wcsnicmp(name,prefix,ARRAYSIZE(prefix)-1)==0;
}
// The live pinned host draws PP_TRANSPARENTBAR and PP_FILL in a memory DC.
// Keep its extent, rounded/native mask, clipping and value-driven geometry. Only
// pixels painted by these exact parts are recolored; user bitmaps are never read.
static HRESULT WINAPI ProgressBackgroundHook(HTHEME theme,HDC dc,int part,int state,const RECT* rect,const RECT* clip) {
    auto native=[&](){return originalProgressBackground(theme,dc,part,state,rect,clip);};
    wchar_t name[64]{};
    if(!rect || !ProgressDC(dc) || !themeClass || FAILED(themeClass(theme,name,64)) || _wcsicmp(name,L"Progress")
        || !((part==PP_TRANSPARENTBAR && state==0) || (part==PP_FILL && state==PBFS_NORMAL))
        || GetMapMode(dc)!=MM_TEXT || GetLayout(dc)!=0)return native();
    if(GetGraphicsMode(dc)==GM_ADVANCED) {
        XFORM x{};
        if(!GetWorldTransform(dc,&x) || x.eM11!=1 || x.eM22!=1 || x.eM12!=0 || x.eM21!=0 || x.eDx!=0 || x.eDy!=0)return native();
    }
    const long long wide=static_cast<long long>(rect->right)-rect->left,high=static_cast<long long>(rect->bottom)-rect->top;
    if(wide<=0 || high<=0 || wide>8192 || high>4096 || wide*high>8388608)return native();
    const int width=static_cast<int>(wide),height=static_cast<int>(high);
    // Allocate before creating GDI resources so allocation failure cannot leak them.
    std::vector<DWORD> before;
    try {before.resize(static_cast<size_t>(width)*height);}catch(...){return native();}
    HDC buffer=CreateCompatibleDC(dc);if(!buffer)return native();
    BITMAPINFO info{};info.bmiHeader.biSize=sizeof(BITMAPINFOHEADER);info.bmiHeader.biWidth=width;info.bmiHeader.biHeight=-height;
    info.bmiHeader.biPlanes=1;info.bmiHeader.biBitCount=32;info.bmiHeader.biCompression=BI_RGB;
    DWORD* pixels=nullptr;HBITMAP bitmap=CreateDIBSection(dc,&info,DIB_RGB_COLORS,reinterpret_cast<void**>(&pixels),nullptr,0);
    if(!bitmap){DeleteDC(buffer);return native();}
    HGDIOBJ previous=SelectObject(buffer,bitmap);HRESULT result=E_FAIL;
    if(previous && previous!=HGDI_ERROR) {
        if(BitBlt(buffer,0,0,width,height,dc,rect->left,rect->top,SRCCOPY)) {
            GdiFlush();CopyMemory(before.data(),pixels,before.size()*sizeof(DWORD));
            if(SetViewportOrgEx(buffer,-rect->left,-rect->top,nullptr)) {
                paintingProgress=true;result=originalProgressBackground(theme,buffer,part,state,rect,clip);paintingProgress=false;
                GdiFlush();
                if(SUCCEEDED(result)) {
                    for(size_t i=0;i<before.size();i++) {
                        DWORD pixel=pixels[i];if((pixel&0xffffff)==(before[i]&0xffffff))continue;
                        const BYTE r=(pixel>>16)&255,g=(pixel>>8)&255,b=pixel&255;
                        COLORREF mapped=part==PP_FILL?progressFill:(r>=128 && g>=128 && b>=128?progressBorder:progressTrack);
                        pixels[i]=(pixel&0xff000000)|(GetRValue(mapped)<<16)|(GetGValue(mapped)<<8)|GetBValue(mapped);
                    }
                    int saved=SaveDC(dc);
                    if(saved) {
                        bool clipped=!clip || IntersectClipRect(dc,clip->left,clip->top,clip->right,clip->bottom)!=ERROR;
                        if(!clipped || !BitBlt(dc,rect->left,rect->top,width,height,buffer,rect->left,rect->top,SRCCOPY))result=E_FAIL;
                        RestoreDC(dc,saved);
                    } else result=E_FAIL;
                }
            }
        }
        SelectObject(buffer,previous);
    }
    DeleteObject(bitmap);DeleteDC(buffer);return FAILED(result)?native():result;
}
static bool ReviewedVersion(const wchar_t* exe) {
    DWORD ignored=0,size=GetFileVersionInfoSizeW(exe,&ignored);
    if(!size || size>1024*1024) return false;
    std::vector<BYTE> data(size);
    VS_FIXEDFILEINFO* fixed=nullptr;UINT length=0;
    return GetFileVersionInfoW(exe,0,size,data.data())
        && VerQueryValueW(data.data(),L"\\",reinterpret_cast<void**>(&fixed),&length)
        && length>=sizeof(*fixed) && fixed->dwSignature==0xfeef04bd
        && fixed->dwFileVersionMS==MAKELONG(101,0)
        && fixed->dwFileVersionLS==MAKELONG(0,2362);
}
static bool ReviewedTemplate(const std::string& bytes) {
    BCRYPT_ALG_HANDLE algorithm=nullptr;BCRYPT_HASH_HANDLE hash=nullptr;
    unsigned char digest[32]{};bool ok=false;
    if(BCryptOpenAlgorithmProvider(&algorithm,BCRYPT_SHA256_ALGORITHM,nullptr,0)<0) return false;
    if(BCryptCreateHash(algorithm,&hash,nullptr,0,nullptr,0,0)>=0) {
        ok=BCryptHashData(hash,reinterpret_cast<PUCHAR>(const_cast<char*>(bytes.data())),static_cast<ULONG>(bytes.size()),0)>=0
            && BCryptFinishHash(hash,digest,sizeof(digest),0)>=0;
        BCryptDestroyHash(hash);
    }
    BCryptCloseAlgorithmProvider(algorithm,0);
    if(!ok) return false;
    const char hex[]="0123456789abcdef";std::string actual;
    for(auto byte:digest){actual+=hex[byte>>4];actual+=hex[byte&15];}
    return actual=="7e8f2bfb81aa6498bd2d236c3eae54c8e42633cf288f9299df62d2537b553bac";
}
// The loading panel paints before the host reads its HTML. Validate the same
// pinned template at initialization so native styling also fails closed.
static bool ReviewedInstalledTemplate() {
    HANDLE source=CreateFileW(templatePath.c_str(),GENERIC_READ,FILE_SHARE_READ|FILE_SHARE_WRITE|FILE_SHARE_DELETE,
        nullptr,OPEN_EXISTING,FILE_ATTRIBUTE_NORMAL,nullptr);
    if(source==INVALID_HANDLE_VALUE)return false;
    bool reviewed=false;
    try {
        LARGE_INTEGER size{};
        if(GetFileSizeEx(source,&size) && size.QuadPart>0 && size.QuadPart<=65536) {
            std::string bytes(static_cast<size_t>(size.QuadPart),'\0');DWORD count=0;
            reviewed=ReadFile(source,bytes.data(),static_cast<DWORD>(bytes.size()),&count,nullptr)
                && count==bytes.size() && ReviewedTemplate(bytes);
        }
    } catch(...) { reviewed=false; }
    CloseHandle(source);return reviewed;
}
static bool ReplaceOnce(std::string& text,const std::string& from,const std::string& to) {
    auto offset=text.find(from);
    if(offset==std::string::npos || text.find(from,offset+from.size())!=std::string::npos) return false;
    text.replace(offset,from.size(),to);return true;
}
static bool ApplyPalette(std::string& html) {
    // Called only on the hash-verified installed template, before PowerToys adds
    // any document content. Tokenization, layout, size and behavior stay intact.
    return ReplaceOnce(html,"colors: {}",R"J3W1(colors: {"editor.background":"#000000","editor.foreground":"#e99499","editorGutter.background":"#000000","editorLineNumber.foreground":"#ad7175","editorLineNumber.activeForeground":"#ffa2a7","editor.selectionBackground":"#420f0c","editor.inactiveSelectionBackground":"#420f0c","editor.selectionForeground":"#e99499","editor.lineHighlightBackground":"#000000","editor.lineHighlightBorder":"#000000","editorCursor.foreground":"#e99499","editorIndentGuide.background1":"#531310","editorWhitespace.foreground":"#7d1310","editorStickyScroll.background":"#000000","editorStickyScrollHover.background":"#1c0a09","minimap.background":"#000000","scrollbarSlider.background":"#420f0c","scrollbarSlider.hoverBackground":"#911410","scrollbarSlider.activeBackground":"#911410","editorWidget.background":"#241010","editorWidget.foreground":"#e99499","editorWidget.border":"#e53935","menu.background":"#241010","menu.foreground":"#e99499","menu.selectionBackground":"#531310","menu.selectionForeground":"#e99499","menu.border":"#e53935","menu.separatorBackground":"#2b0e0d","focusBorder":"#e53935","descriptionForeground":"#bd787d","input.background":"#000000","input.foreground":"#e99499","input.border":"#a3676b"})J3W1")
        && ReplaceOnce(html,"rules: customTokenThemeRules",R"J3W1(rules: customTokenThemeRules.concat([{"token":"","foreground":"e99499"},{"token":"comment","foreground":"ad7175"},{"token":"string","foreground":"bd787d"},{"token":"keyword","foreground":"f7463c"},{"token":"number","foreground":"d4868b"},{"token":"regexp","foreground":"d4868b"},{"token":"operator","foreground":"e99499"},{"token":"delimiter","foreground":"e99499"},{"token":"type","foreground":"b37175"},{"token":"variable","foreground":"e99499"},{"token":"function","foreground":"ffa2a7"},{"token":"tag","foreground":"f7463c"},{"token":"attribute.name","foreground":"e95551"}]))J3W1")
        && ReplaceOnce(html,"/* Fits content to window size */",
            R"J3W1(@media (forced-colors: none) { html, body, #container { background: #000000; color: #e99499; } }
        /* Fits content to window size */)J3W1");
}
static HANDLE ThemedTemplate(HANDLE source) {
    LARGE_INTEGER size{};
    if(!GetFileSizeEx(source,&size) || size.QuadPart<=0 || size.QuadPart>65536) return INVALID_HANDLE_VALUE;
    std::string html(static_cast<size_t>(size.QuadPart),'\0');DWORD count=0;
    bool read=ReadFile(source,html.data(),static_cast<DWORD>(html.size()),&count,nullptr) && count==html.size();
    LARGE_INTEGER zero{};
    if(!SetFilePointerEx(source,zero,nullptr,FILE_BEGIN) || !read || !ReviewedTemplate(html) || !ApplyPalette(html)) return INVALID_HANDLE_VALUE;
    // An exclusive, delete-on-close temporary template leaves Program Files and
    // previewed documents untouched. It contains no previewed file content.
    // Preview handlers run at low integrity. The ordinary temp directory can
    // be readable but not writable there. Use Windows' existing low-integrity
    // data folder; never alter ACLs, token integrity or preview isolation.
    PWSTR low=nullptr;
    if(FAILED(SHGetKnownFolderPath(FOLDERID_LocalAppDataLow,0,nullptr,&low))) return INVALID_HANDLE_VALUE;
    std::wstring temp;
    try { temp=low; } catch(...) { CoTaskMemFree(low);throw; }
    CoTaskMemFree(low);
    if(temp.empty()) return INVALID_HANDLE_VALUE;
    if(temp.back()!=L'\\')temp+=L'\\';
    unsigned char random[16]{};
    if(BCryptGenRandom(nullptr,random,sizeof(random),BCRYPT_USE_SYSTEM_PREFERRED_RNG)<0) return INVALID_HANDLE_VALUE;
    const wchar_t hex[]=L"0123456789abcdef";
    std::wstring name=temp;name+=L"j3w1-preview-";
    for(auto byte:random){name+=hex[byte>>4];name+=hex[byte&15];}
    name+=L".tmp";
    HANDLE output=originalCreateFile(name.c_str(),GENERIC_READ|GENERIC_WRITE,FILE_SHARE_READ|FILE_SHARE_DELETE,
        nullptr,CREATE_NEW,FILE_ATTRIBUTE_TEMPORARY|FILE_FLAG_DELETE_ON_CLOSE,nullptr);
    if(output==INVALID_HANDLE_VALUE) return output;
    HANDLE reader=INVALID_HANDLE_VALUE;
    if(WriteFile(output,html.data(),static_cast<DWORD>(html.size()),&count,nullptr) && count==html.size()
        && SetFilePointerEx(output,zero,nullptr,FILE_BEGIN)) {
        // Return a read-only handle, as requested by the host FileStream.
        if(!DuplicateHandle(GetCurrentProcess(),output,GetCurrentProcess(),&reader,FILE_GENERIC_READ,FALSE,0)) reader=INVALID_HANDLE_VALUE;
    }
    CloseHandle(output);return reader;
}
static HANDLE WINAPI CreateFileHook(LPCWSTR name,DWORD access,DWORD share,LPSECURITY_ATTRIBUTES security,
                                    DWORD disposition,DWORD flags,HANDLE model) {
    HANDLE file=originalCreateFile(name,access,share,security,disposition,flags,model);
    DWORD error=GetLastError();
    // Match the resolved file, not a suffix supplied by an untrusted document.
    if(file!=INVALID_HANDLE_VALUE && enabled.load() && !redirecting && access==GENERIC_READ
        && disposition==OPEN_EXISTING && !(flags&(FILE_FLAG_OVERLAPPED|FILE_FLAG_DELETE_ON_CLOSE)) && !HighContrast()) {
        wchar_t resolved[32768]{};
        DWORD length=GetFinalPathNameByHandleW(file,resolved,32768,FILE_NAME_NORMALIZED|VOLUME_NAME_DOS);
        if(length && length<32768 && _wcsicmp(resolved,templatePath.c_str())==0) {
            redirecting=true;
            HANDLE replacement=INVALID_HANDLE_VALUE;
            try { replacement=ThemedTemplate(file); } catch(...) { LARGE_INTEGER zero{};SetFilePointerEx(file,zero,nullptr,FILE_BEGIN); }
            redirecting=false;
            if(replacement!=INVALID_HANDLE_VALUE){CloseHandle(file);file=replacement;}
        }
    }
    SetLastError(error);return file;
}
BOOL Wh_ModInit() {
    wchar_t exe[32768]{};
    DWORD length=GetModuleFileNameW(nullptr,exe,32768);
    if(!length || length>=32768 || !ReviewedVersion(exe) || HighContrast()) return FALSE;
    std::wstring path=exe;auto split=path.find_last_of(L"\\");
    if(split==std::wstring::npos || _wcsicmp(path.c_str()+split+1,L"PowerToys.MonacoPreviewHandler.exe")!=0) return FALSE;
    templatePath=L"\\\\?\\"+path.substr(0,split)+L"\\Assets\\Monaco\\index.html";
    if(!ReviewedInstalledTemplate())return FALSE;
    themeClass=reinterpret_cast<ThemeClassFn>(GetProcAddress(GetModuleHandleW(L"uxtheme.dll"),MAKEINTRESOURCEA(74)));
    if(!themeClass)return FALSE;
    if(!Wh_SetFunctionHook(reinterpret_cast<void*>(CreateFileW),reinterpret_cast<void*>(CreateFileHook),reinterpret_cast<void**>(&originalCreateFile))) return FALSE;
    if(!Wh_SetFunctionHook(reinterpret_cast<void*>(DrawThemeBackground),reinterpret_cast<void*>(ProgressBackgroundHook),reinterpret_cast<void**>(&originalProgressBackground))
        || !Wh_SetFunctionHook(reinterpret_cast<void*>(FillRect),reinterpret_cast<void*>(LoadingFillHook),reinterpret_cast<void**>(&originalFillRect))
        || !Wh_SetFunctionHook(reinterpret_cast<void*>(SetTextColor),reinterpret_cast<void*>(LoadingTextHook),reinterpret_cast<void**>(&originalSetTextColor))
        || !Wh_SetFunctionHook(reinterpret_cast<void*>(SetBkColor),reinterpret_cast<void*>(LoadingBkHook),reinterpret_cast<void**>(&originalSetBkColor))
        || !Wh_SetFunctionHook(reinterpret_cast<void*>(BeginPaint),reinterpret_cast<void*>(BeginPaintHook),reinterpret_cast<void**>(&originalBeginPaint))
        || !Wh_SetFunctionHook(reinterpret_cast<void*>(EndPaint),reinterpret_cast<void*>(EndPaintHook),reinterpret_cast<void**>(&originalEndPaint))) return FALSE;
    enabled=Wh_GetIntSetting(L"enabled")!=0;return TRUE;
}
void Wh_ModSettingsChanged(){enabled=Wh_GetIntSetting(L"enabled")!=0;}
void Wh_ModUninit(){enabled=false;}
