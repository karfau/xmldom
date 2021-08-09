#!/bin/bash
set -eu

WAIT=60

while ! (TZ=UTC date -Isec && npm owner ls xmldom | grep "$1")
do
  echo "$1 is not listed as owner, trying again in $WAIT sec"
  sleep $WAIT
done

echo "$1 is listed as owner"
