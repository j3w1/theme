// Synthetic native regression. No desktop input, upstream templates or user data.
#include <windows.h>
#include <cassert>
#include <cstdio>
#include <string>
#include <vector>
static unsigned installedHooks=0;
static BOOL Wh_SetFunctionHook(void* function,void*,void** original){++installedHooks;*original=function;return TRUE;}
static BOOL Wh_ApplyHookOperations(){return TRUE;}
static int Wh_GetIntSetting(const wchar_t*){return 1;}
template<class... Args> static void Wh_Log(const wchar_t*,Args...){}
static int writeFault=0;
static BOOL TestWrite(HANDLE file,const void* bytes,DWORD size,DWORD* written,OVERLAPPED* overlapped){
 if(writeFault){int fault=writeFault;writeFault=fault==1?0:3;
  if(fault!=3)WriteFile(file,bytes,size/2,written,overlapped);
  else *written=0;
  SetLastError(ERROR_WRITE_FAULT);return FALSE;
 }
 return WriteFile(file,bytes,size,written,overlapped);
}
#define WriteFile TestWrite
#include "../ports/windows/dist/j3w1-powertoys-markdown.wh.cpp"
#undef WriteFile
static std::string Read(const std::wstring& path){
 HANDLE f=CreateFileW(path.c_str(),GENERIC_READ,FILE_SHARE_READ,nullptr,OPEN_EXISTING,0,nullptr);assert(f!=INVALID_HANDLE_VALUE);
 LARGE_INTEGER size{};assert(GetFileSizeEx(f,&size));std::string bytes(size.QuadPart,' ');DWORD read=0;
 assert(ReadFile(f,bytes.data(),static_cast<DWORD>(bytes.size()),&read,nullptr)&&read==bytes.size());CloseHandle(f);return bytes;
}
static void Save(const std::wstring& path,const std::string& bytes,bool track){
 SetLastError(0);HANDLE f=track?CreateHook(path.c_str(),GENERIC_WRITE,0,nullptr,CREATE_ALWAYS,0,nullptr):
  CreateFileW(path.c_str(),GENERIC_WRITE,0,nullptr,CREATE_ALWAYS,0,nullptr);assert(f!=INVALID_HANDLE_VALUE);
 DWORD written=0;assert(WriteFile(f,bytes.data(),static_cast<DWORD>(bytes.size()),&written,nullptr)&&written==bytes.size());CloseHandle(f);
}
int main(){
 assert(Digest(reinterpret_cast<const BYTE*>("abc"),3,"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"));
 assert(!Wh_ModInit()); // The regression process is not the admitted PowerToys host.
 static_assert(std::size(browserPins)>=2);
 std::vector<BYTE> runtime0(0x100000),runtime1(0x100000),unreviewedRuntime(0x100000);
 auto module0=reinterpret_cast<HMODULE>(runtime0.data()),module1=reinterpret_cast<HMODULE>(runtime1.data());
 assert(HookBoundary<0>(module0));auto firstString=boundaries[0].originalString;
 assert(HookBoundary<1>(module1));assert(installedHooks==4);
 assert(boundaries[0].originalString==firstString&&boundaries[0].originalString!=boundaries[1].originalString);
 assert(HookBoundary<0>(module0)&&installedHooks==4);
 assert(!HookBoundary<0>(reinterpret_cast<HMODULE>(unreviewedRuntime.data()))&&installedHooks==4);
 assert(!InstallBoundary(nullptr)&&!InstallBoundary(GetModuleHandleW(nullptr))&&installedHooks==4);
 std::string head="<html><head><style>"+std::string(2400,' ')+"</style></head><body>";
 const HeaderPin pin{head.size(),18,2400,"5759a956b737c1ba4755b47ec52b11a3766c413aba9719eca00af75f7fea9bd5"};
 std::wstring prefix(head.begin(),head.end()),suffix=L"Unicode specimen: \u73ab\u7470 \u00e9 \u0627\u0644\u0646\u0635 \U0001f339 </body></html>",themed;
 assert(PaletteString((prefix+suffix).c_str(),themed,&pin,1));assert(themed.size()==prefix.size()+suffix.size());
 assert(themed.substr(pin.length)==suffix);assert(themed.substr(0,pin.styleOffset)==prefix.substr(0,pin.styleOffset));
 assert(themed.substr(pin.styleOffset+pin.styleLength)==(prefix+suffix).substr(pin.styleOffset+pin.styleLength));
 std::wstring unknown=prefix+suffix;unknown[0]=L'X';assert(!PaletteString(unknown.c_str(),themed,&pin,1));
 assert(!PaletteString(L"short",themed,&pin,1));assert(!PaletteString(nullptr,themed,&pin,1));
 assert(!PaletteString((prefix+suffix).c_str(),themed)); // Unknown production header refuses styling.
 HeaderPin bad=pin;bad.styleOffset=pin.length+1;assert(!PaletteString((prefix+suffix).c_str(),themed,&bad,1));
 assert(GuidHtml(L"01234567-89ab-cdef-0123-456789abcdef.html"));assert(!GuidHtml(L"user.html"));
 wchar_t temp[MAX_PATH]{};assert(GetTempPathW(MAX_PATH,temp));tempFolder=std::wstring(temp)+L"j3w1-markdown-regression-"+std::to_wstring(GetCurrentProcessId())+L"\\";
 assert(CreateDirectoryW(tempFolder.c_str(),nullptr));
 // GetTempPathW may return an 8.3 alias on hosted Windows. Admit only the
 // canonical specimen path; production deliberately refuses aliases.
 HANDLE directory=CreateFileW(tempFolder.c_str(),FILE_READ_ATTRIBUTES,FILE_SHARE_READ|FILE_SHARE_WRITE|FILE_SHARE_DELETE,
  nullptr,OPEN_EXISTING,FILE_FLAG_BACKUP_SEMANTICS|FILE_FLAG_OPEN_REPARSE_POINT,nullptr);assert(directory!=INVALID_HANDLE_VALUE);
 wchar_t canonical[32768]{};DWORD canonicalLength=GetFinalPathNameByHandleW(directory,canonical,32768,FILE_NAME_NORMALIZED|VOLUME_NAME_DOS);
 assert(CloseHandle(directory));assert(canonicalLength>4&&canonicalLength<32768&&wcsncmp(canonical,L"\\\\?\\",4)==0);
 tempFolder=canonical+4;if(tempFolder.back()!=L'\\')tempFolder+=L'\\';assert(NoReparseParents(tempFolder));
 enabled=true;originalCreateFile=CreateFileW;
 std::wstring file=tempFolder+L"01234567-89ab-cdef-0123-456789abcdef.html",unowned=tempFolder+L"11234567-89ab-cdef-0123-456789abcdef.html",link=tempFolder+L"21234567-89ab-cdef-0123-456789abcdef.html";
 std::string document=head+std::string(1500010,'z')+"</body></html>";
 Save(unowned,document,false);assert(PaletteFile(unowned,&pin,1)==FilePaletteResult::unchanged);assert(Read(unowned)==document);
 Save(file,document,true);assert(createdFiles.size()==1);
 // A file reached through a short-name alias is still rejected, even when it
 // has the tracked numeric identity. Do not weaken the production boundary.
 wchar_t alias[32768]{};DWORD aliasLength=GetShortPathNameW(file.c_str(),alias,32768);
 if(aliasLength&&aliasLength<32768&&_wcsicmp(alias,file.c_str())!=0){
  HANDLE aliased=CreateFileW(alias,GENERIC_READ,FILE_SHARE_READ,nullptr,OPEN_EXISTING,0,nullptr);assert(aliased!=INVALID_HANDLE_VALUE);
  FILE_ID_INFO identity{};assert(!FileIdentity(aliased,alias,identity));assert(CloseHandle(aliased));
  assert(PaletteFile(alias,&pin,1)==FilePaletteResult::unchanged);assert(Read(file)==document);
 }
 assert(PaletteFile(file,&pin,1)==FilePaletteResult::changed);
 std::string expected=document;expected.replace(pin.styleOffset,pin.styleLength,Style(pin));assert(Read(file)==expected);
 // Only the same-length CSS extent changes; the entire synthetic suffix is exact.
 Save(file,document,false);writeFault=1;assert(PaletteFile(file,&pin,1)==FilePaletteResult::unchanged);assert(Read(file)==document);
 writeFault=2;assert(PaletteFile(file,&pin,1)==FilePaletteResult::restorationFailed);writeFault=0;Save(file,document,false);
 assert(CreateHardLinkW(link.c_str(),file.c_str(),nullptr));assert(PaletteFile(file,&pin,1)==FilePaletteResult::unchanged);assert(Read(file)==document);assert(DeleteFileW(link.c_str()));
 Save(file,"\xef\xbb\xbf"+document,false);assert(PaletteFile(file,&pin,1)==FilePaletteResult::changed);assert(Read(file)=="\xef\xbb\xbf"+expected);
 Save(file,"X"+document.substr(1),false);assert(PaletteFile(file,&pin,1)==FilePaletteResult::unchanged);assert(Read(file)=="X"+document.substr(1));
 assert(!TempPath(tempFolder+L"..\\01234567-89ab-cdef-0123-456789abcdef.html"));
 assert(!TempPath(tempFolder+L"user.md"));
 Wh_ModUninit();assert(createdFiles.empty());assert(!enabled);
 assert(DeleteFileW(file.c_str()));assert(DeleteFileW(unowned.c_str()));assert(RemoveDirectoryW(tempFolder.c_str()));
 puts("PASS: Unicode and content preservation; exact header refusal; same-length large-file CSS; ownership, path and hard-link rejection; BOM; partial-write recovery and failed-restoration result; unload");
}
