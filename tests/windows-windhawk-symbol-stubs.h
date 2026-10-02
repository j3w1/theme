// Native test builds do not initialize Windhawk or resolve real shell symbols.
struct WH_FIND_SYMBOL { void* address; PCWSTR symbol; };
static HANDLE Wh_FindFirstSymbol(HMODULE,void*,WH_FIND_SYMBOL*){return nullptr;}
static BOOL Wh_FindNextSymbol(HANDLE,WH_FIND_SYMBOL*){return FALSE;}
static void Wh_FindCloseSymbol(HANDLE){}
