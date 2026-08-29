FROM nginx:1.27-alpine

# Railway supplies PORT and the release configuration supplies PLATFORM_UPSTREAM.
# Restrict template substitution to those two values so native Nginx variables
# such as $host and $proxy_add_x_forwarded_for remain intact.
ENV NGINX_ENVSUBST_FILTER="PORT|PLATFORM_UPSTREAM"

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY index.html /usr/share/nginx/html/index.html
COPY trading-journal /usr/share/nginx/html/trading-journal
COPY landing-assets /usr/share/nginx/html/landing-assets
