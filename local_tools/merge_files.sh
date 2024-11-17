#!/bin/bash

# ヘルプメッセージ
function show_help() {
  echo "Usage: $0 -dir <directories> -out <output_file> [-ext <extensions>] [-exclude <directories>] [-gitignore <gitignore_file>] [-h]"
  echo "  -dir: Directories to process (space-separated list)"
  echo "  -out: Output file name"
  echo "  -ext: File extensions to include (space-separated list; optional)"
  echo "  -exclude: Directories to exclude (space-separated list)"
  echo "  -gitignore: Path to a custom .gitignore file"
  echo "  -h  : Show this help message"
  exit 0
}

# デバッグメッセージ用
function debug_message() {
  echo "[DEBUG] $1" >&2
}

# 必須引数の検証
function check_required_arguments() {
  if [[ -z "${directories[*]}" || -z "$output_file" ]]; then
    echo "[ERROR] Missing required arguments" >&2
    show_help
  fi
}

# `.gitignore` を考慮した find コマンド用除外リスト生成
function build_gitignore_exclude() {
  local gitignore_file="$1"
  local exclude_patterns=()
  if [[ -f "$gitignore_file" ]]; then
    debug_message "Processing .gitignore: $gitignore_file"
    while IFS= read -r pattern; do
      [[ -z "$pattern" || "$pattern" =~ ^# ]] && continue
      exclude_patterns+=("-not -path '*$pattern*'")
    done < "$gitignore_file"
  fi
  echo "${exclude_patterns[@]}"
}

# ファイルをまとめる関数
function merge_files() {
  debug_message "Starting file merge process..."

  > "$output_file"
  debug_message "Output file initialized: $output_file"

  for dir in "${directories[@]}"; do
    if [[ -d "$dir" ]]; then
      debug_message "Processing directory: $dir"

      local exclude_args=()
      for exclude in "${exclude_dirs[@]}"; do
        exclude_args+=("-not -path '$exclude/*'")
      done

      if [[ -n "$gitignore_file" ]]; then
        gitignore_exclude=$(build_gitignore_exclude "$gitignore_file")
        exclude_args+=("$gitignore_exclude")
      fi

      if [[ -z "${extensions[*]}" ]]; then
        eval "find \"$dir\" -type f ${exclude_args[*]}" | while read -r file; do
          if [[ -r "$file" ]]; then
            debug_message "Adding file: $file"
            {
              echo "$file"
              echo '``````'
              cat "$file"
              echo -e '\n``````'
            } >> "$output_file"
          else
            debug_message "Skipping unreadable file: $file"
          fi
        done
      else
        for ext in "${extensions[@]}"; do
          eval "find \"$dir\" -type f -name \"*$ext\" ${exclude_args[*]}" | while read -r file; do
            if [[ -r "$file" ]]; then
              debug_message "Adding file: $file"
              {
                echo "$file"
                echo '``````'
                cat "$file"
                echo -e '\n``````'
              } >> "$output_file"
            else
              debug_message "Skipping unreadable file: $file"
            fi
          done
        done
      fi
    else
      debug_message "Skipping invalid directory: $dir"
    fi
  done

  debug_message "File merge process completed."
}

# 引数解析
while [[ $# -gt 0 ]]; do
  case $1 in
    -dir)
      shift
      directories=()
      while [[ $# -gt 0 && $1 != -* ]]; do
        directories+=("$1")
        shift
      done
      ;;
    -out)
      shift
      output_file="$1"
      shift
      ;;
    -ext)
      shift
      extensions=()
      while [[ $# -gt 0 && $1 != -* ]]; do
        extensions+=("$1")
        shift
      done
      ;;
    -exclude)
      shift
      exclude_dirs=()
      while [[ $# -gt 0 && $1 != -* ]]; do
        exclude_dirs+=("$1")
        shift
      done
      ;;
    -gitignore)
      shift
      gitignore_file="$1"
      shift
      ;;
    -h)
      show_help
      ;;
    *)
      echo "[ERROR] Unknown argument: $1" >&2
      show_help
      ;;
  esac
done

check_required_arguments
merge_files
