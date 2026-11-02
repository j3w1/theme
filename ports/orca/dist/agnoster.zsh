# Generated from canonical j3w1 roles; source after loading the Agnoster theme.
# Prompt branding is independent of semantic ANSI green for diffs and status.
AGNOSTER_DIR_BG='#420f0c'
AGNOSTER_DIR_FG='#e99499'
AGNOSTER_CONTEXT_BG='#000000'
AGNOSTER_CONTEXT_FG='#e99499'
AGNOSTER_GIT_CLEAN_BG='#140b0b'
AGNOSTER_GIT_CLEAN_FG='#e99499'
AGNOSTER_GIT_DIRTY_BG='#140b0b'
AGNOSTER_GIT_DIRTY_FG='#e99499'
AGNOSTER_BZR_CLEAN_BG='#000000'
AGNOSTER_BZR_CLEAN_FG='#e99499'
AGNOSTER_BZR_DIRTY_BG='#000000'
AGNOSTER_BZR_DIRTY_FG='#e99499'
AGNOSTER_HG_NEWFILE_BG='#000000'
AGNOSTER_HG_NEWFILE_FG='#e99499'
AGNOSTER_HG_CHANGED_BG='#000000'
AGNOSTER_HG_CHANGED_FG='#e99499'
AGNOSTER_HG_CLEAN_BG='#000000'
AGNOSTER_HG_CLEAN_FG='#e99499'
AGNOSTER_VENV_BG='#000000'
AGNOSTER_VENV_FG='#e99499'
AGNOSTER_AWS_PROD_BG='#000000'
AGNOSTER_AWS_PROD_FG='#e99499'
AGNOSTER_AWS_BG='#000000'
AGNOSTER_AWS_FG='#e99499'
AGNOSTER_STATUS_BG='#000000'
AGNOSTER_STATUS_FG='#e99499'
AGNOSTER_STATUS_RETVAL_FG='#f07178'
AGNOSTER_STATUS_ROOT_FG='#e5c07b'
AGNOSTER_STATUS_JOB_FG='#d4868b'

# GNU ls type colours; preserve executable, permission and extension rules.
# Filter our owned types so sourcing this file again remains idempotent.
() {
  local entry
  local -a retained
  for entry in "${(@s.:.)LS_COLORS}"; do
    case "$entry" in no=*|fi=*|di=*|ln=*|or=*|mi=*) ;; *) retained+=("$entry") ;; esac
  done
  export LS_COLORS="${(j.:.)retained}${retained:+:}no=38;2;233;148;153:fi=38;2;233;148;153:di=38;2;255;162;167:ln=38;2;212;134;139:or=38;2;240;113;120:mi=38;2;240;113;120"
}
