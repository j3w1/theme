// Synthetic receipts use distinct public object identities; no app injection.
static void CheckChromeTransitions() {
 winrt::init_apartment(winrt::apartment_type::multi_threaded);
 {
 assert(ChromeTransitionPartAdmission(L"ContentPresenter",true,false,false));
 assert(ChromeTransitionPartAdmission(L"RootGrid",false,true,false));
 assert(ChromeTransitionPartAdmission(L"RootGrid",false,false,true));
 assert(!ChromeTransitionPartAdmission(L"RootGrid",true,false,false));
 assert(!ChromeTransitionPartAdmission(L"Artwork",false,true,false));
 assert(!ChromeTransitionPartAdmission(L"ContentPresenterExtra",true,false,false));
 assert(!ChromeTransitionPartAdmission(L"RootGrid",false,false,false));
 assert(ChromeTransitionAdmission(830000,true,true));
 for(auto duration:{0ll,829999ll,830001ll,1000000ll})assert(!ChromeTransitionAdmission(duration,true,true));
 assert(!ChromeTransitionAdmission(830000,false,true));
 assert(!ChromeTransitionAdmission(830000,true,false));
 auto native=box_value(1),theme=box_value(2),app=box_value(3);ProjectedObject current=native;
 auto read=[&]{return current;};auto write=[&](auto const& value){current=value;};
 OwnedChromeTransition entry{native,theme};
 assert(UpdateChromeTransition(entry,true,read,write)&&entry.owned&&Identity(current,theme));
 // An owned removal must not erase proof of the native template.
 assert(ChromeBaseCapturedTransitionAdmission(true,830000,true,Identity(current,entry.applied),entry.owned,entry.replaced));
 assert(!ChromeBaseCapturedTransitionAdmission(true,830000,false,true,true,false));
 assert(!ChromeBaseCapturedTransitionAdmission(true,830000,true,false,true,false));
 assert(!ChromeBaseCapturedTransitionAdmission(true,830000,true,true,false,false));
 assert(!ChromeBaseCapturedTransitionAdmission(true,830000,true,true,true,true));
 for(auto before:{0ll,829999ll,830001ll,1000000ll})assert(!ChromeBaseCapturedTransitionAdmission(true,before,true,true,true,false));
 assert(!ChromeBaseCapturedTransitionAdmission(false,830000,true,true,true,false));
 assert(UpdateChromeTransition(entry,false,read,write)&&!entry.owned&&Identity(current,native));
 assert(UpdateChromeTransition(entry,true,read,write)&&entry.owned);
 current=app;
 assert(UpdateChromeTransition(entry,false,read,write)&&entry.replaced&&!entry.owned&&Identity(current,app));
 current=native;
 assert(UpdateChromeTransition(entry,true,read,write)&&entry.replaced&&Identity(current,native));
 // Read failures and unexplained replacements never authorize a write.
 entry={native,theme};unsigned writes=0;
 auto unavailable=[&]()->ProjectedObject{throw hresult_error(E_FAIL);};
 auto counted=[&](auto const& value){++writes;current=value;};
 assert(!UpdateChromeTransition(entry,true,unavailable,counted)&&writes==0&&!entry.owned);
 current=app;assert(!UpdateChromeTransition(entry,true,read,counted)&&writes==0&&Identity(current,app));
 // Mutation-then-failure retains its receipt, and cleanup can retry exactly.
 current=native;entry={native,theme};
 auto partial=[&](auto const& value){current=value;throw hresult_error(E_FAIL);};
 assert(!UpdateChromeTransition(entry,true,read,partial)&&entry.owned&&Identity(current,theme));
 auto denied=[&](auto const&){throw hresult_access_denied();};
 assert(!UpdateChromeTransition(entry,false,read,denied)&&entry.owned&&Identity(current,theme));
 assert(UpdateChromeTransition(entry,false,read,write)&&!entry.owned&&Identity(current,native));
 // A null/deleted property after admission also belongs to the application.
 entry={native,theme};assert(UpdateChromeTransition(entry,true,read,write));current=nullptr;
 assert(UpdateChromeTransition(entry,false,read,write)&&entry.replaced&&!current);
 assert(UpdateChromeTransition(entry,true,read,write)&&!current);
 // Exercise the production null replacement, including retry and app takeover.
 current=native;entry={native,nullptr};writes=0;
 assert(ChromeTransitionIdentity(nullptr,nullptr));
 assert(!ChromeTransitionIdentity(native,nullptr)&&!ChromeTransitionIdentity(nullptr,native));
 assert(UpdateChromeTransition(entry,true,read,counted)&&entry.owned&&!current&&writes==1);
 assert(UpdateChromeTransition(entry,true,read,counted)&&entry.owned&&!current&&writes==1);
 assert(ChromeBaseCapturedTransitionAdmission(!current,830000,true,ChromeTransitionIdentity(current,entry.applied),entry.owned,entry.replaced));
 assert(!UpdateChromeTransition(entry,false,read,denied)&&entry.owned&&!current);
 assert(UpdateChromeTransition(entry,false,read,counted)&&!entry.owned&&Identity(current,native)&&writes==2);
 assert(UpdateChromeTransition(entry,true,read,write)&&entry.owned&&!current);
 current=app;
 assert(UpdateChromeTransition(entry,false,read,counted)&&entry.replaced&&!entry.owned&&Identity(current,app)&&writes==2);
 current=nullptr;
 assert(UpdateChromeTransition(entry,true,read,counted)&&entry.replaced&&!current&&writes==2);
 current=native;entry={native,nullptr};
 assert(!UpdateChromeTransition(entry,true,read,partial)&&entry.owned&&!current);
 assert(UpdateChromeTransition(entry,false,read,write)&&!entry.owned&&Identity(current,native));
 puts("PASS: exact transition identity restoration, owned null removal, later replacements/deletion, admission refusal and partial-write retry");
 }
 winrt::uninit_apartment();
}

// Exercise the production state-key resolver in every generated app adapter.
// The endpoints must be themed before an 83ms transition can be removed safely.
static void CheckChromeHoverStates() {
 for(auto property:{L"Background",L"Foreground",L"BorderBrush"}) {
  std::wstring plain=property==std::wstring_view{L"Background"}?L"ButtonBackground":property==std::wstring_view{L"Foreground"}?L"ButtonForeground":L"ButtonBorderBrush";
  for(auto state:{L"Normal",L"PointerOver",L"Pressed",L"Disabled",L"Checked",L"CheckedPointerOver",L"CheckedPressed",L"CheckedDisabled",L"Selected",L"OverflowPointerOver",L"OverflowPressed"}) {
   assert(ChromeSetterState(state));auto key=ChromeStatePaletteKey(property,state);
   bool found=false;for(auto const& rule:rules)if(key==rule.key){found=true;auto color=ChromeSetterColor(property,state);assert(color.A==rule.color.A&&color.R==rule.color.R&&color.G==rule.color.G&&color.B==rule.color.B);}
   assert(found);
  }
  assert(ChromeStatePaletteKey(property,L"Normal")==plain);
  assert(ChromeStatePaletteKey(property,L"PointerOver")==plain+L"PointerOver");
  assert(ChromeStatePaletteKey(property,L"Pressed")==plain+L"Pressed");
  assert(ChromeStatePaletteKey(property,L"Disabled")==plain+L"Disabled");
  std::wstring toggle=property==std::wstring_view{L"Background"}?L"ToggleButtonBackgroundChecked":property==std::wstring_view{L"Foreground"}?L"ToggleButtonForegroundChecked":L"ToggleButtonBorderBrushChecked";
  assert(ChromeStatePaletteKey(property,L"Checked")==toggle);
  assert(ChromeStatePaletteKey(property,L"CheckedPointerOver")==toggle+L"PointerOver");
  assert(ChromeStatePaletteKey(property,L"CheckedPressed")==toggle+L"Pressed");
  assert(ChromeStatePaletteKey(property,L"CheckedDisabled")==toggle+L"Disabled");
  assert(ChromeStatePaletteKey(property,L"Selected")==toggle);
 }
 assert(ChromeStatePaletteKey(L"Foreground",L"CheckedPointerOver",true)==L"DropDownButtonForegroundSecondaryPointerOver");
 for(auto state:{L"Indeterminate",L"Unrecognized",L"Focused",L"CheckedExtra"}) {
  assert(!ChromeSetterState(state));bool refused=false;try{ChromeStatePaletteKey(L"Background",state);}catch(hresult_error const&){refused=true;}assert(refused);
 }
 for(auto property:{L"Content",L"Opacity",L"Width"}){bool refused=false;try{ChromeStatePaletteKey(property,L"Normal");}catch(hresult_error const&){refused=true;}assert(refused);}
 puts("PASS: normal/hover/pressed/disabled and checked state palette parity; unknown states and non-color properties refused");
}
