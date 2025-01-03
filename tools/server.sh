#!/bin/bash

authbind --deep http-server -p 443 -c-1 -S -C ~/ssl/server.crt -K ~/ssl/server.key
