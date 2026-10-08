// Legacy XAML chrome ownership in a synthetic process; no terminal UI/input.
#include <windows.h>
#include <cassert>
#include <cstdio>
#include <cstring>
static BOOL Wh_SetFunctionHook(void*,void*,void**){return TRUE;}
static BOOL Wh_ApplyHookOperations(){return TRUE;}
static int Wh_GetIntSetting(PCWSTR){return 1;}
#include "../ports/windows/dist/j3w1-terminal-chrome.wh.cpp"
static DWORD Handles(){DWORD count=0;assert(GetProcessHandleCount(GetCurrentProcess(),&count));return count;}
#include "windows-chrome-transition-assertions.h"
int main(int argc,char** argv) {
 if(argc>1&&strcmp(argv[1],"background-transition-ownership")==0){CheckChromeTransitions();return 0;}
 if(argc>1&&strcmp(argv[1],"hover-state-palette")==0){CheckChromeHoverStates();return 0;}
 assert(argc==2);init_apartment(apartment_type::multi_threaded);
 if(strcmp(argv[1],"legacy-boundary")==0) {
  assert(J3W1_LEGACY_XAML&&RootCandidateClass(L"TerminalApp.TabRowControl"));

  const wchar_t* chrome=J3W1_LEGACY_XAML?L"TerminalApp.TabRowControl":
#if J3W1_TEST_PAINT
   L"PaintUI.Ribbon";
#else
   L"NotepadXamlUI.MainMenuBar";
#endif
  std::array<std::wstring_view,5> names{L"",chrome,L"TerminalApp.TerminalPage",chrome,L"Other.Root"};
  std::array<int,5> parents{0,2,0,2,0};
  auto name=[&](int at){return names[at];};auto parent=[&](int at){return parents[at];};
  auto sameRoot=[](int at){return at!=4;};
  assert(SelectChromeRoot(1,2,0,name,parent,sameRoot)==1); // Generic content cannot discard chrome.
  parents[1]=3;assert(SelectChromeRoot(1,2,0,name,parent,sameRoot)==3); // Topmost admitted ancestor.
  assert(SelectChromeRoot(1,3,0,name,parent,sameRoot)==3); // Already admitted window content.
  parents[1]=4;parents[4]=3;assert(SelectChromeRoot(1,2,0,name,parent,sameRoot)==1); // Foreign root stops traversal.
  assert(SelectChromeRoot(2,3,0,name,parent,sameRoot)==0); // Content does not grant admission to data.
  assert(SelectChromeRoot(1,4,0,name,parent,sameRoot)==1);
  parents[1]=1;assert(SelectChromeRoot(1,2,0,name,parent,sameRoot)==1); // Bounded cyclic ancestry.

  for(auto type:{L"TerminalApp.TerminalPage",L"Microsoft.Terminal.Control.TermControl",L"TerminalApp.CommandPalette",L"TerminalApp.SuggestionsControl",L"Other.TabRowControl",L"TerminalApp.TabRowControlExtra"})assert(!RootCandidateClass(type));
  assert(!ReviewedPackage()&&!ReviewedRuntime());
  assert(PopupChromeClass(L"Windows.UI.Xaml.Controls.MenuFlyoutPresenter"));
  assert(CompositeButtonChrome(L"Microsoft.UI.Xaml.Controls.SplitButton"));
  puts("PASS: exact tab/menu scope and unsupported process/runtime refusal");
 } else if(strcmp(argv[1],"legacy-ownership")==0) {
  auto native=box_value(1),theme=box_value(2),app=box_value(3);ChromeFrameValue current{true,native};
  auto read=[&]{return current;};auto write=[&](auto const& value){current={true,value};};
  ClockState clock=ClockState::Stopped;auto clockRead=[&]{return clock;};OwnedChromeFrame entry{native,theme};
  clock=ClockState::Active;assert(!UpdateChromeFrame(entry,true,read,write,clockRead)&&Identity(current.value,native));
  clock=ClockState::Stopped;assert(UpdateChromeFrame(entry,true,read,write,clockRead));
  assert(UpdateChromeFrame(entry,false,read,write,clockRead)&&Identity(current.value,native));
  entry={native,theme};assert(UpdateChromeFrame(entry,true,read,write,clockRead));current.value=app;
  assert(UpdateChromeFrame(entry,false,read,write,clockRead)&&Identity(current.value,app));
  struct Ref{bool live;bool get(){return live;}};struct Receipt{Ref control;bool owned;};
  std::deque<Receipt> receipts{{{true},true},{{false},true}};
  bool refuse=true;auto restore=[&](auto& retired){if(refuse)return false;retired.clear();return true;};
  assert(!PruneChromeColorStates(receipts,restore)&&receipts.size()==2&&receipts.back().owned);
  refuse=false;assert(PruneChromeColorStates(receipts,restore)&&receipts.size()==1&&receipts.front().control.live);
  puts("PASS: stopped-clock writes, exact restore, later app replacement and retired receipt retry");
 } else if(strcmp(argv[1],"legacy-lifecycle")==0) {
  const auto baseline=Handles();
  for(unsigned repeat=0;repeat<5;++repeat) {
   assert(StartHooks());Wh_ModAfterInit();assert(rootDiscovery.load()&&stopDiscovery&&discovery);
   Wh_ModUninit();assert(!rootDiscovery.load()&&!stopDiscovery&&!discovery&&channels.empty()&&Handles()==baseline);
  }
  puts("PASS: legacy worker reconfiguration and exact event/thread handle restoration");
 } else assert(false);
 uninit_apartment();return 0;
}
