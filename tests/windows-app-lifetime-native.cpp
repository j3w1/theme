// Synthetic host: exercise graceful process exit and controlled unload without
// injecting a mod, reading a document, creating a visible window or desktop input.
#include <windows.h>
#include <cassert>
#include <cstdio>
#include <cstring>
static BOOL Wh_SetFunctionHook(void*,void*,void**){return TRUE;}
static BOOL Wh_ApplyHookOperations(){return TRUE;}
static int Wh_GetIntSetting(PCWSTR){return 0;}
static void Wh_Log(PCWSTR,...){ }
#if J3W1_TEST_CALCULATOR
#include "../ports/windows/dist/j3w1-calculator.wh.cpp"
#define STOP_EVENT discoveryStop
#else
#include "../ports/windows/dist/j3w1-notepad-native.wh.cpp"
#define STOP_EVENT stopDiscovery
#endif
static DWORD Handles(){DWORD value=0;assert(GetProcessHandleCount(GetCurrentProcess(),&value));return value;}
static void Start(){enabled=true;StartDiscovery();assert(discovery&&STOP_EVENT);}
static void Stop(){Wh_ModUninit();assert(!discovery&&!STOP_EVENT);}
int main(int argc,char** argv){
 assert(argc==2);
 Start();
 if(strcmp(argv[1],"exit-active")==0)return 0;
 if(strcmp(argv[1],"exit-completed")==0){
  SetEvent(STOP_EVENT);assert(WaitForSingleObject(discovery,2000)==WAIT_OBJECT_0);
  // The engine omits Wh_ModUninit on host exit. Leave completed worker ownership
  // intact to exercise this separate path through the real CRT destructors.
  return 0;
 }
 Stop();
 const DWORD baseline=Handles();
 for(unsigned i=0;i<5;i++){
  Start();
  if(strcmp(argv[1],"reconfigure")==0)Wh_ModSettingsChanged();
  Stop();assert(Handles()==baseline);
 }
 puts("Native worker shutdown and handle restoration passed");return 0;
}
