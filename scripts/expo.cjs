'use strict';

// Expo SDK 54's HTTP response cache can return a consumed response body when
// persisting its metadata fails. Skip only that API cache; keep Metro caching,
// dependency validation, Expo networking and the app's backend requests enabled.
process.env.EXPO_NO_CACHE ??= '1';

require('expo/bin/cli');
