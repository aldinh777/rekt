import * as http from './lib/http'

http.startHttpServer()

import * as bundler from './lib/bundler'
import * as hr from './lib/hot-reload'

bundler.watchBundle()
hr.startHotReloadServer()
