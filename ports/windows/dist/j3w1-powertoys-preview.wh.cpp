// ==WindhawkMod==
// @id j3w1-powertoys-preview
// @name j3w1 PowerToys text preview
// @description Token palette for the exact reviewed Monaco preview template
// @version 1.0
// @author j3w1
// @include PowerToys.MonacoPreviewHandler.exe
// @architecture x86-64
// @compilerOptions -lbcrypt -lversion -luser32
// ==/WindhawkMod==
// ==WindhawkModSettings==
/*
- enabled: true
*/
// ==/WindhawkModSettings==
#include <windows.h>
#include <bcrypt.h>
#include <string>
#include <vector>
#include <atomic>

static decltype(&CreateFileW) originalCreateFile;
static std::wstring templatePath;
static std::atomic<bool> enabled{false};
static thread_local bool redirecting=false;

static bool HighContrast() {
    HIGHCONTRASTW value{sizeof(value)};
    return !SystemParametersInfoW(SPI_GETHIGHCONTRAST,sizeof(value),&value,0)
        || (value.dwFlags&HCF_HIGHCONTRASTON);
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
    wchar_t temp[MAX_PATH+1]{};
    DWORD length=GetTempPathW(MAX_PATH,temp);
    if(!length || length>=MAX_PATH) return INVALID_HANDLE_VALUE;
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
    if(!Wh_SetFunctionHook(reinterpret_cast<void*>(CreateFileW),reinterpret_cast<void*>(CreateFileHook),reinterpret_cast<void**>(&originalCreateFile))) return FALSE;
    enabled=Wh_GetIntSetting(L"enabled")!=0;return TRUE;
}
void Wh_ModSettingsChanged(){enabled=Wh_GetIntSetting(L"enabled")!=0;}
void Wh_ModUninit(){enabled=false;}
