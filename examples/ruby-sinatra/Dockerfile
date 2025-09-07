FROM ruby:3.3-alpine
WORKDIR /app
COPY app.rb /app/
RUN apk add --no-cache build-base \
 && gem install sinatra
ENV MS_BASE=http://web:8000
ENV MS_TOKEN=CHANGE_ME
EXPOSE 5003
CMD ["ruby", "app.rb", "-p", "5003", "-o", "0.0.0.0"]

