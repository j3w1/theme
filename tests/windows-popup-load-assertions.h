// Shared native regression for deferred popup event ownership. No app input.
static void CheckPopupLoadLifecycle() {
 const std::wstring prefix=J3W1_LEGACY_XAML?L"Windows.UI.Xaml.Controls.":L"Microsoft.UI.Xaml.Controls.";
 for(auto suffix:{L"MenuFlyoutPresenter",L"FlyoutPresenter",L"ToolTip",L"MenuFlyoutItem",L"MenuFlyoutSubItem"}) {
  auto type=prefix+suffix;
  assert(PopupObservationAdmission(type,true,true));
  assert(!PopupObservationAdmission(type,false,true));
  assert(!PopupObservationAdmission(type,true,false));
  assert(!PopupDiscoveryAdmission(type,true,true,false,true)); // Observe before Loaded; no paint yet.
  assert(PopupDiscoveryAdmission(type,true,true,true,true));
  assert(!PopupDiscoveryAdmission(type,true,true,true,false)); // A moved popup must be re-admitted.
 }
 for(auto type:{L"PaintUI.D2DSwapChainPanel",L"PaintUI.ColorRadioButton",L"TerminalApp.TerminalPage",L"NotepadXamlUI.Document",L"Other.MenuFlyoutPresenter"})
  assert(!PopupObservationAdmission(type,true,true));
 struct Receipt {int element;event_token loaded;bool registered;};
 std::deque<Receipt> receipts{{1,{11},true},{0,{12},true},{2,{13},true}};
 std::vector<int64_t> removed;bool failure=true;
 auto resolve=[](auto const& entry){return entry.element;};
 auto remove=[&](int element,event_token token){if(failure&&element==1)return false;removed.push_back(token.value);return true;};
 // Expiration releases capacity without calling back into a dead element.
 assert(RevokePopupLoadEvents(receipts,resolve,[](int){return false;},remove));
 assert(receipts.size()==2&&removed.empty());
 // One loaded endpoint is detached once; other pending endpoints remain.
 assert(RevokePopupLoadEvents(receipts,resolve,[](int element){return element==2;},remove));
 assert(receipts.size()==1&&removed.size()==1&&removed[0]==13);
 // A failed removal prevents unloading its handler. Successful retry keeps
 // the original token, including zero: token values are opaque, not booleans.
 assert(!RevokePopupLoadEvents(receipts,resolve,[](int){return true;},remove));
 assert(receipts.size()==1&&receipts[0].loaded.value==11&&receipts[0].registered);
 failure=false;assert(RevokePopupLoadEvents(receipts,resolve,[](int){return true;},remove));
 assert(receipts.empty()&&removed.size()==2&&removed[1]==11);
 receipts.push_back({3,{0},true});receipts.push_back({4,{14},false});
 assert(RevokePopupLoadEvents(receipts,resolve,[](int){return true;},remove));
 assert(receipts.empty()&&removed.size()==3&&removed.back()==0);
 receipts.push_back({5,{15},true});
 auto refused=[](auto const&)->int{throw 1;};
 assert(!RevokePopupLoadEvents(receipts,refused,[](int){return true;},remove)&&receipts.size()==1);
 assert(RevokePopupLoadEvents(receipts,resolve,[](int){return true;},remove)&&receipts.empty());
 puts("PASS: pre-load observation, load-time admission, expired subscriptions and failed-detach retry");
}
