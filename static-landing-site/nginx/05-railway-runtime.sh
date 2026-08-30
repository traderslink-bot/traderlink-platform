#!/bin/sh

# The official Nginx entrypoint launches executable *.sh files in their own
# process. Keep runtime validation and resolver-file generation isolated from
# the parent entrypoint shell.
set -eu

fail() {
    echo "static front door configuration error: $1" >&2
    exit 1
}

case "${PORT:-}" in
    ''|*[!0-9]*) fail "PORT must be a numeric listen port" ;;
esac

case "${PLATFORM_UPSTREAM:-}" in
    http://*) ;;
    *) fail "PLATFORM_UPSTREAM must use http:// Railway private networking" ;;
esac

platform_authority=${PLATFORM_UPSTREAM#http://}

case "$platform_authority" in
    ''|*/*|*\?*|*\#*|*@*)
        fail "PLATFORM_UPSTREAM must contain only a Railway private host and port"
        ;;
esac

platform_host=${platform_authority%:*}
platform_port=${platform_authority##*:}

if [ "$platform_host" = "$platform_authority" ]; then
    fail "PLATFORM_UPSTREAM must include its private service port"
fi

case "$platform_host" in
    *.railway.internal) ;;
    *) fail "PLATFORM_UPSTREAM must target a railway.internal service" ;;
esac

case "$platform_port" in
    ''|*[!0-9]*) fail "PLATFORM_UPSTREAM must include a numeric port" ;;
esac

resolver_config=${NGINX_RESOLV_CONF_PATH:-/etc/resolv.conf}
runtime_resolver=

if [ ! -r "$resolver_config" ]; then
    fail "runtime DNS resolver configuration is not readable"
fi

while read -r resolver_key resolver_value resolver_rest || [ -n "${resolver_key:-}" ]; do
    if [ "$resolver_key" = "nameserver" ] && [ -n "${resolver_value:-}" ]; then
        runtime_resolver=$resolver_value
        break
    fi
done < "$resolver_config"

if [ -z "$runtime_resolver" ]; then
    fail "no runtime DNS resolver was found"
fi

case "$runtime_resolver" in
    *[!0-9A-Fa-f:.]*) fail "runtime DNS resolver must be an IP address" ;;
esac

case "$runtime_resolver" in
    *:*) nginx_resolver="[$runtime_resolver]" ;;
    *) nginx_resolver=$runtime_resolver ;;
esac

runtime_directory=${NGINX_RUNTIME_DIRECTORY_PATH:-/etc/nginx/runtime}
runtime_file=$runtime_directory/railway-resolver.conf

mkdir -p "$runtime_directory"
umask 022
{
    printf 'resolver %s valid=10s;\n' "$nginx_resolver"
    printf 'resolver_timeout 5s;\n'
} > "$runtime_file"
