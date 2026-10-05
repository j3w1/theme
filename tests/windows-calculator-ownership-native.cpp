// Synthetic ownership/clock regressions use the generated production adapter.
// No visible windows, app injection, application content or desktop input.
#include <windows.h>
#include <cassert>
#include <cstdio>
#include <cstring>
static BOOL Wh_SetFunctionHook(void*,void*,void**){return TRUE;}
static BOOL Wh_ApplyHookOperations(){return TRUE;}
static int Wh_GetIntSetting(PCWSTR){return 0;}
static void Wh_Log(PCWSTR,...){ }
#include "../ports/windows/dist/j3w1-calculator.wh.cpp"
int main(int argc,char** argv){
 assert(argc==2);
 if(strcmp(argv[1],"cached-color-frame")==0) {
  assert(ChromeColorFrameAdmission(L"ContentPresenter",L"Background",1,true,0));
  assert(ChromeColorFrameAdmission(L"RootGrid",L"BorderBrush",1,true,0));
  assert(ChromeColorFrameAdmission(L"ChevronIcon",L"Foreground",1,true,0));
  for(auto property:{L"Text",L"Content",L"Opacity",L"Width",L"RenderTransform"})assert(!ChromeColorFrameAdmission(L"ContentPresenter",property,1,true,0));
  assert(!ChromeColorFrameAdmission(L"Artwork",L"Background",1,true,0));
  assert(!ChromeColorFrameAdmission(L"ContentPresenter",L"Background",2,true,0));
  assert(!ChromeColorFrameAdmission(L"ContentPresenter",L"Background",1,false,0));
  assert(!ChromeColorFrameAdmission(L"ContentPresenter",L"Background",1,true,1));
  assert(!ChromeColorState(L"Selected")&&!ChromeColorState(L"Other"));
  assert(ChromeSetterState(L"Selected")&&ChromeSetterState(L"CheckedPointerOver"));
  assert(ChromeSetterAdmission(L"Background",true,false));
  assert(!ChromeSetterAdmission(L"Background",true,true));
  assert(!ChromeSetterAdmission(L"Content",true,false));
  assert(!ChromeSetterAdmission(L"Background",false,false));
  winrt::init_apartment(winrt::apartment_type::multi_threaded);
  auto native=box_value(1),theme=box_value(2),app=box_value(3);ChromeFrameValue current{true,native};
  auto read=[&]{return current;};auto write=[&](auto const& value){current={true,value};};
  auto clock=ClockState::Stopped;auto getClock=[&]{return clock;};OwnedChromeFrame entry{native,theme};
  clock=ClockState::Active;assert(!UpdateChromeFrame(entry,true,read,write,getClock)&&!entry.owned&&Identity(current.value,native));
  clock=ClockState::Filling;assert(!UpdateChromeFrame(entry,true,read,write,getClock)&&!entry.owned);
  clock=ClockState::Stopped;assert(UpdateChromeFrame(entry,true,read,write,getClock)&&entry.owned&&Identity(current.value,theme));
  assert(UpdateChromeFrame(entry,false,read,write,getClock)&&!entry.owned&&Identity(current.value,native));
  auto partial=[&](auto const& value){write(value);throw hresult_error(E_FAIL);};
  assert(!UpdateChromeFrame(entry,true,read,partial,getClock)&&entry.owned&&Identity(current.value,theme));
  assert(!UpdateChromeFrame(entry,false,read,partial,getClock)&&entry.owned&&Identity(current.value,native));
  assert(UpdateChromeFrame(entry,false,read,write,getClock)&&!entry.owned);
  entry={native,theme};assert(UpdateChromeFrame(entry,true,read,write,getClock));current={true,app};
  assert(UpdateChromeFrame(entry,false,read,write,getClock)&&Identity(current.value,app));
  current={false,nullptr};entry={native,theme};assert(!UpdateChromeFrame(entry,true,read,write,getClock)&&!entry.owned);
  puts("PASS: cached color-only frame scope, running-clock refusal, exact object restore, partial writes and application replacement");return 0;
 }

 if(strcmp(argv[1],"composite-button-scope")==0) {
  assert(CompositeButtonChrome(L"Microsoft.UI.Xaml.Controls.SplitButton"));
  for(auto type:{L"PaintUI.ColorRadioButton",L"PaintUI.Canvas",L"Microsoft.UI.Xaml.Controls.ColorPicker",L"NotepadXamlUI.TabsBar",L"Other.SplitButton",L"Microsoft.UI.Xaml.Controls.SplitButtonExtra"})assert(!CompositeButtonChrome(type));
  puts("PASS: split-button owner admitted; application data controls and lookalikes excluded");return 0;
 }

 winrt::init_apartment(winrt::apartment_type::multi_threaded);
 if(strcmp(argv[1],"animation-frame")==0) {
  auto original=box_value(1),applied=box_value(2),foreign=box_value(3);
  AnimationFrameValue slot{true,original};
  auto read=[&]{return slot;};auto write=[&](auto const& value){slot={true,value};};
  OwnedAnimationFrame entry{original,applied};
  assert(ApplyAnimationFrame(entry,read,write));assert(entry.owned&&Identity(slot.value,applied));
  assert(RestoreAnimationFrame(entry,read,write));assert(!entry.owned&&Identity(slot.value,original));
  slot={false,nullptr};entry={original,applied};assert(!ApplyAnimationFrame(entry,read,write));assert(!entry.owned);
  slot={true,foreign};assert(!ApplyAnimationFrame(entry,read,write));assert(!entry.owned&&Identity(slot.value,foreign));
  slot={true,original};auto reject=[&](auto const&){throw hresult_error(E_FAIL);};
  assert(!ApplyAnimationFrame(entry,read,reject));assert(entry.owned);
  assert(RestoreAnimationFrame(entry,read,write));assert(!entry.owned&&Identity(slot.value,original));
  auto partial=[&](auto const& value){write(value);throw hresult_error(E_FAIL);};
  assert(!ApplyAnimationFrame(entry,read,partial));assert(entry.owned&&Identity(slot.value,applied));
  assert(!RestoreAnimationFrame(entry,read,reject));assert(entry.owned&&Identity(slot.value,applied));
  assert(RestoreAnimationFrame(entry,read,write));assert(!entry.owned&&Identity(slot.value,original));
  assert(ApplyAnimationFrame(entry,read,write));slot={true,foreign};
  assert(RestoreAnimationFrame(entry,read,write));assert(!entry.owned&&Identity(slot.value,foreign));
  slot={true,original};assert(ApplyAnimationFrame(entry,read,write));slot={false,nullptr};
  assert(RestoreAnimationFrame(entry,read,write));assert(!entry.owned&&!slot.exists);
  // Restoration changes only slot zero, retaining a later native keyframe.
  auto appended=box_value(4);std::vector<IInspectable> frames{original};entry={original,applied};
  auto readFrame=[&]{return AnimationFrameValue{!frames.empty(),frames.empty()?nullptr:frames[0]};};
  auto writeFrame=[&](auto const& value){frames.at(0)=value;};
  assert(ApplyAnimationFrame(entry,readFrame,writeFrame));frames.push_back(appended);
  assert(RestoreAnimationFrame(entry,readFrame,writeFrame));
  assert(frames.size()==2&&Identity(frames[0],original)&&Identity(frames[1],appended));
  puts("PASS: native keyframe identity, missing/foreign rejection, partial writes, retry, app replacement/deletion and appended-frame preservation");
  return 0;
 }
 if(strcmp(argv[1],"clock-lifecycle")==0) {
  ClockState state=ClockState::Stopped;unsigned stops=0,writes=0;
  auto clock=[&]{return state;};auto stop=[&]{++stops;state=ClockState::Stopped;};
  assert(EnsureStoppedClock(clock,stop)&&stops==0);
  state=ClockState::Active;assert(EnsureStoppedClock(clock,stop)&&stops==1);
  state=ClockState::Filling;assert(EnsureStoppedClock(clock,stop)&&stops==2);
  state=ClockState::Active;assert(!EnsureStoppedClock(clock,[]{throw hresult_error(E_FAIL);}));
  assert(state==ClockState::Active);
  state=ClockState::Filling;assert(!EnsureStoppedClock(clock,[]{}));
  assert(!EnsureStoppedClock([]()->ClockState {throw hresult_error(E_FAIL);},stop));
  state=static_cast<ClockState>(99);assert(!EnsureStoppedClock(clock,stop)&&stops==2);
  auto original=box_value(1),applied=box_value(2);OwnedAnimationFrame frame{original,applied,true};
  AnimationFrameValue current{true,applied};
  auto read=[&]{return current;};auto write=[&](auto const& value){++writes;current={true,value};};
  frame={original,applied,false};current={true,original};
  state=ClockState::Active;assert(!ApplyStoppedAnimationFrame(frame,read,write,clock));
  assert(writes==0&&!frame.owned&&Identity(current.value,original));
  state=ClockState::Filling;assert(!ApplyStoppedAnimationFrame(frame,read,write,clock));assert(writes==0);
  state=ClockState::Stopped;assert(ApplyStoppedAnimationFrame(frame,read,write,clock));
  assert(writes==1&&frame.owned&&Identity(current.value,applied));writes=0;
  state=ClockState::Active;assert(!RestoreStoppedAnimationFrame(frame,read,write,clock));
  assert(writes==0&&frame.owned&&Identity(current.value,applied));
  state=ClockState::Filling;assert(!RestoreStoppedAnimationFrame(frame,read,write,clock));assert(writes==0);
  assert(EnsureStoppedClock(clock,stop));assert(RestoreStoppedAnimationFrame(frame,read,write,clock));
  assert(writes==1&&!frame.owned&&Identity(current.value,original));
  puts("PASS: active/filling clocks stopped before mutation; unknown, failed and unchanged clocks reject writes; stopped restoration retains original identity");
  return 0;
 }
    if(strcmp(argv[1], "resource-ownership") == 0) {
        winrt::init_apartment(winrt::apartment_type::multi_threaded);
        auto baseline=box_value(L"native"), applied=box_value(L"theme"), later=box_value(L"app");
        LocalResourceValue actual;
        ControlKey entry{L"ButtonForeground",nullptr,applied};
        auto read=[&]{return actual;};
        auto write=[&](auto const& value){actual={true,value};};
        auto remove=[&]{actual={};};
        assert(ApplyControlKey(entry,read,write)&&actual.exists&&Identity(actual.value,applied));
        assert(RestoreControlKey(entry,read,write,remove)&&!actual.exists);
        actual={true,baseline};entry={L"ButtonForeground",nullptr,applied};
        assert(ApplyControlKey(entry,read,write));
        assert(RestoreControlKey(entry,read,write,remove)&&Identity(actual.value,baseline));
        actual={true,nullptr};entry={L"ButtonForeground",nullptr,applied};
        assert(ApplyControlKey(entry,read,write)&&entry.local);
        assert(RestoreControlKey(entry,read,write,remove)&&actual.exists&&!actual.value);
        actual={true,baseline};entry={L"ButtonForeground",nullptr,applied};
        assert(ApplyControlKey(entry,read,write));actual={true,later};
        assert(RestoreControlKey(entry,read,write,remove)&&Identity(actual.value,later));
        entry={L"ButtonForeground",nullptr,applied};assert(ApplyControlKey(entry,read,write));actual={};
        assert(RestoreControlKey(entry,read,write,remove)&&!actual.exists);
        actual={true,baseline};entry={L"ButtonForeground",nullptr,applied};
        auto partial=[&](auto const& value){write(value);throw hresult_error(E_FAIL);};
        assert(!ApplyControlKey(entry,read,partial)&&entry.owned&&Identity(entry.before,baseline));
        assert(RestoreControlKey(entry,read,write,remove)&&Identity(actual.value,baseline));
        entry={L"ButtonForeground",nullptr,applied};assert(ApplyControlKey(entry,read,write));
        auto denied=[&](auto const&){throw hresult_access_denied();};
        assert(!RestoreControlKey(entry,read,denied,remove)&&entry.owned&&Identity(entry.before,baseline));
        assert(RestoreControlKey(entry,read,write,remove)&&Identity(actual.value,baseline));
        actual={};entry={L"ButtonForeground",nullptr,applied};assert(ApplyControlKey(entry,read,write));
        auto deniedRemove=[&]{throw hresult_access_denied();};
        assert(!RestoreControlKey(entry,read,write,deniedRemove)&&entry.owned);
        assert(RestoreControlKey(entry,read,write,remove)&&!actual.exists);
        puts("PASS: resource absence, local/null baselines, later app replacement/deletion, partial writes and cleanup retry");
        return 0;
    }

 assert(false&&"Unknown regression case");return 1;
}
