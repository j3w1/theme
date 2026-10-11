#pragma once
#include <map>
// Exercise the production local-write algorithm with independent host edits.
static void CheckControlLocalKeyScaling() {
 struct Entry { std::vector<ControlKey> keys; } entry;
 struct Item { hstring key; ProjectedObject value; };
 auto original=box_value(7),applied=box_value(8),later=box_value(9);
 std::vector<Item> palette;for(unsigned i=0;i<351;++i)palette.push_back({hstring(L"Key"+std::to_wstring(i)),applied});
 std::map<hstring,ProjectedObject> local;
 unsigned reads=0,comparisons=0,writes=0;
 auto read=[&](hstring const& key){
  ++reads;for(auto const& pair:local){++comparisons;if(pair.first==key)return LocalResourceValue{true,pair.second};}
  return LocalResourceValue{};
 };
 auto write=[&](hstring const& key,ProjectedObject const& value){++writes;local[key]=value;};
 auto apply=[&](auto writer){return ApplyControlLocalKeys(entry,palette,[](auto const& item){return item.key;},
  [](auto const& item){return item.value;},read,writer);};
 assert(apply(write)&&reads==351&&comparisons==0&&writes==0&&entry.keys.empty()&&local.empty());
 // Keys resolved through a merged source are absent here, and never copied
 // into the host's local dictionary. Explicit null remains a local baseline.
 reads=comparisons=writes=0;local[palette[0].key]=nullptr;local[palette[1].key]=original;
 assert(apply([&](auto const& key,auto const& value){write(key,value);if(key==palette[0].key)local[palette[1].key]=later;}));
 assert(entry.keys.size()==2&&entry.keys[0].local&&!entry.keys[0].before);
 assert(Identity(entry.keys[1].before,later)&&writes==2&&comparisons<=702);
 local[palette[1].key]=original; // A later app replacement must survive undo.
 for(auto& key:entry.keys)assert(RestoreControlKey(key,[&]{return read(key.key);},
  [&](auto const& value){write(key.key,value);},[&]{local.erase(key.key);}));
 assert(local.contains(palette[0].key)&&!local[palette[0].key]&&Identity(local[palette[1].key],original));
 entry.keys.clear();local.clear();local[palette[0].key]=original;
 assert(!apply([&](auto const& key,auto const& value){write(key,value);throw hresult_error(E_FAIL);}));
 assert(entry.keys.size()==1&&entry.keys[0].owned&&Identity(entry.keys[0].before,original));
 auto& key=entry.keys[0];
 assert(!RestoreControlKey(key,[&]{return read(key.key);},[](auto const&){throw hresult_error(E_FAIL);},[&]{local.erase(key.key);}));
 assert(key.owned&&RestoreControlKey(key,[&]{return read(key.key);},[&](auto const& value){write(key.key,value);},[&]{local.erase(key.key);}));
 assert(Identity(local[palette[0].key],original));
}
