FROM nginx:1.27-alpine

# Railway supplies PORT and the release configuration supplies PLATFORM_UPSTREAM.
# The runtime hook validates both values and writes the container's current
# resolver into an Nginx include before the official template renderer runs.
# Keep native Nginx variables out of envsubst.
ENV NGINX_ENVSUBST_FILTER="PORT|PLATFORM_UPSTREAM"

COPY nginx/05-railway-runtime.sh /docker-entrypoint.d/05-railway-runtime.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/05-railway-runtime.sh \
    && chmod +x /docker-entrypoint.d/05-railway-runtime.sh \
    && printf 'nameserver 127.0.0.11\n' > /tmp/static-resolver-proof.conf \
    && PORT=8080 \
       PLATFORM_UPSTREAM=http://proxy-proof.railway.internal:8080 \
       NGINX_RESOLV_CONF_PATH=/tmp/static-resolver-proof.conf \
       NGINX_RUNTIME_DIRECTORY_PATH=/tmp/static-runtime-proof \
       /docker-entrypoint.d/05-railway-runtime.sh \
    && test -s /tmp/static-runtime-proof/railway-resolver.conf \
    && rm -rf /tmp/static-runtime-proof /tmp/static-resolver-proof.conf
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY index.html /usr/share/nginx/html/index.html
COPY robots.txt /usr/share/nginx/html/robots.txt
COPY landing-pages-sitemap.xml /usr/share/nginx/html/landing-pages-sitemap.xml
COPY trading-journal /usr/share/nginx/html/trading-journal
COPY landing-assets /usr/share/nginx/html/landing-assets
