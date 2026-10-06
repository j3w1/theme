// Synthetic receipts use distinct public object identities; no app injection.
static void CheckChromeTransitions() {
 winrt::init_apartment(winrt::apartment_type::multi_threaded);
 {
 assert(ChromeTransitionAdmission(830000,true,true));
 for(auto duration:{0ll,829999ll,830001ll,1000000ll})assert(!ChromeTransitionAdmission(duration,true,true));
 assert(!ChromeTransitionAdmission(830000,false,true));
 assert(!ChromeTransitionAdmission(830000,true,false));
 auto native=box_value(1),theme=box_value(2),app=box_value(3);ProjectedObject current=native;
 auto read=[&]{return current;};auto write=[&](auto const& value){current=value;};
 OwnedChromeTransition entry{native,theme};
 assert(UpdateChromeTransition(entry,true,read,write)&&entry.owned&&Identity(current,theme));
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
 puts("PASS: exact transition identity restoration, later replacements/deletion, admission refusal and partial-write retry");
 }
 winrt::uninit_apartment();
}
