---
mapped_pages:
  - https://www.elastic.co/guide/en/kibana/current/logging-settings.html
  - https://www.elastic.co/guide/en/cloud-enterprise/current/ece-kibana-logging-settings.html
applies_to:
  deployment:
    self: all
---

# Logging settings [logging-settings]

You do not need to configure any additional settings to use the logging features in {{kib}}. Logging is enabled by default and will log at `info` level using the `pattern` layout, which outputs logs to `stdout`.

However, if you are planning to ingest your logs using Elasticsearch or another tool, we recommend using the `json` layout, which produces logs in ECS format. In general, `pattern` layout is recommended when raw logs will be read by a human, and `json` layout when logs will be read by a machine.

::::{note}
The logging configuration is validated against the predefined schema and if there are any issues with it, {{kib}} will fail to start with the detailed error message.
::::


{{kib}} relies on three high-level entities to set the logging service: appenders, loggers, and root. These can be configured in the `logging` namespace in `kibana.yml`.

* Appenders define where log messages are displayed (stdout or console) and their layout (`pattern` or `json`). They also allow you to specify if you want the logs stored and, if so, where (file on the disk).
* Loggers define what logging settings, such as the level of verbosity and the appenders, to apply to a particular context. Each log entry context provides information about the service or plugin that emits it and any of its sub-parts, for example, `metrics.ops` or `elasticsearch.query`.
* Root is a logger that applies to all the log entries in {{kib}}.

The following table serves as a quick reference for different logging configuration keys. Note that these are not stand-alone settings and may require additional logging configuration. See the [Configure Logging in {{kib}}](docs-content://deploy-manage/monitor/logging-configuration/kibana-logging.md) guide and complete [examples](docs-content://deploy-manage/monitor/logging-configuration/kibana-log-settings-examples.md) for common configuration use cases.

|     |     |
| --- | --- |
| `logging.appenders[].<appender-name>` | Unique appender identifier. |
| `logging.appenders[].console:` | Appender to use for logging records to **stdout**. By default, uses the `[%date][%level][%logger] %message %error` **pattern*** layout. To use a ***json**, set the [layout type to `json`](docs-content://deploy-manage/monitor/logging-configuration/kibana-log-settings-examples.md#log-in-json-ecs-example). <br><br>{applies_to}`stack: ga 9.1` `%error` is present since Stack version 9.1.|
| `logging.appenders[].file:` | Allows you to specify a fileName to write log records to disk. To write [all log records to file](docs-content://deploy-manage/monitor/logging-configuration/kibana-log-settings-examples.md#log-to-file-example), add the file appender to `root.appenders`. If configured, you also need to specify [`logging.appenders.file.pathName`](docs-content://deploy-manage/monitor/logging-configuration/kibana-log-settings-examples.md#log-to-file-example). |
| `logging.appenders[].rolling-file:` | Similar to [Log4j’s](https://logging.apache.org/log4j/2.x/) `RollingFileAppender`, this appender will log to a file and rotate if following a rolling strategy when the configured policy triggers. There are currently two policies supported: [`size-limit`](docs-content://deploy-manage/monitor/logging-configuration/kibana-logging.md#size-limit-triggering-policy) and [`time-interval`](docs-content://deploy-manage/monitor/logging-configuration/kibana-logging.md#time-interval-triggering-policy). |
| `logging.appenders[].<appender-name>.type` | The appender type determines where the log messages are sent. Options are `console`, `file`, `rewrite`, `rolling-file`. Required. |
| `logging.appenders[].<appender-name>.fileName` | Determines the filepath where the log messages are written to for file and rolling-file appender types. Required for appenders that write to file. |
| `logging.appenders[].<appender-name>.policy.type` | Specify the triggering policy for when a rollover should occur for the `rolling-file` type appender. |
| `logging.appenders[].<appender-name>.policy.interval` | Specify the time interval for rotating a log file for a `time-interval` type `rolling-file` appender. **Default 24h** |
| `logging.appenders[].<appender-name>.policy.size` | Specify the size limit at which the policy should trigger a rollover for a `size-limit` type `rolling-file` appender. **Default 100mb**. |
| `logging.appenders[].<appender-name>.policy.interval` | Specify the time interval at which the policy should trigger a rollover for a time-interval type `rolling-file` appender. |
| `logging.appenders[].<appender-name>.policy.modulate` | Whether the interval should be adjusted to cause the next rollover to occur on the interval boundary. Boolean. Default `true`. |
| `logging.appenders[].<appender-name>.strategy.type` | Rolling file strategy type. Only `numeric` is currently supported. |
| `logging.appenders[].<appender-name>.strategy.pattern` | The suffix to append to the file path when rolling. Must include `%i`. |
| `logging.appenders[].<appender-name>.strategy.max` | The maximum number of files to keep. Optional. Default is `7` and the maximum is `100`. |
| `logging.appenders[].<appender-name>.layout.type` | Determines how the log messages are displayed. Options are `pattern`, which provides human-readable output, or `json`, which provides ECS-compliant output. Required. |
| `logging.appenders[].<appender-name>.layout.highlight` | Optional boolean to highlight log messages in color. Applies to `pattern` layout only. Default is `false`. |
| `logging.appenders[].<appender-name>.layout.pattern` | Optional [string pattern](docs-content://deploy-manage/monitor/logging-configuration/kibana-logging.md#pattern-layout) for placeholders that will be replaced with data from the actual log message. Applicable to pattern type layout only. |
| `logging.root.appenders[]` | List of specific appenders to apply to `root`. Defaults to `console` with `pattern` layout. |
| `logging.root.level` | Specify default verbosity for all log messages to fall back to if not specifically configured at the individual logger level. Options are `all`, `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `off`. The `all` and `off` levels can be used only in configuration and are just handy shortcuts that allow you to log every log record or disable logging entirely or for a specific logger. Default is `info`. |
| `logging.loggers[].<logger>.name:` | Specific logger instance. |
| `logging.loggers[].<logger>.level` | Specify verbosity of log messages for <logger> context. Optional and inherits the verbosity of any ancestor logger, up to the `root` logger `level`. |
| `logging.loggers[].<logger>.appenders` | Determines the appender to apply to a specific logger context as an array. Optional and falls back to the appender(s) of the `root` logger if not specified. |
| $$$enable-http-debug-logs$$$ `deprecation.enable_http_debug_logs` | Optional boolean to log debug messages when a deprecated API is called. Default is `false`. |

For details on audit logging settings, refer to the [{{kib}} security settings](./security-settings.md#audit-logging-settings).