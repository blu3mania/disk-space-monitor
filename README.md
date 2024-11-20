# disk-space-monitor
[![Apache 2.0 License](https://img.shields.io/badge/License-Apache%202.0-yellow)](https://raw.githubusercontent.com/blu3mania/disk-space-monitor/main/LICENSE)
[![node.js 18+](https://img.shields.io/badge/node.js-18.0.0-blue?logo=node.js)](https://nodejs.org/en/)
[![Latest Release](https://img.shields.io/github/v/release/blu3mania/disk-space-monitor)](https://github.com/blu3mania/disk-space-monitor/releases/latest)

Monitor disk space usage and notify user by email or system notification.

It can be run as a standalone application or as a system service.

**Note**, this package is written as ES Module starting with 2.0. For CommonJS version, use version 1.x from
CommonJS branch.

## Run these steps first:

1. One of the packages, "diskusage", uses native modules and relies on "node-gyp" to build the project. As a
   result, there are some prerequisites that need to be installed/configured. Please refer to [node-gyp's
   instructions](https://github.com/nodejs/node-gyp#installation).

2. Edit src/settings.json.
   * service defines service parameters when installed as a system service:
     * name is the service name to be used.
     * account info is optional. If provided, the service will be running as the specified account. These properties
       can be provided:
       * name is account's name, when running on Windows
       * password is account's password, when running on Windows
       * domain is optional, and should be provided if the account is a domain account when running on Windows
       * user is the user name, when running on Linux
       * group is the group name, when running on Linux
   ```
    "service": {
        "name": "Disk Space Monitor",
        "account": {
            "name": "{account name}",
            "password": "{account password}",
            "domain": "{account domain}"
        }
    },
   ```
   * disks lists all the disks this script needs to montior.
     * path is the path to the disk. On Windows it's usaully the drive letter followed by a colon, e.g. "C:".
       On Linux it is usually the mounted file system path, e.g. "/dev".
     * threshold is the amount of free space to trigger the notificaiton.

       It can be a percentage of total disk space, e.g. "5%", or in bytes, e.g. "4096" or "1024B".
       Multiple-byte units are supported, with the unit defined with either SI prefixes or binary prefixes.
       * Supported units with SI prefix: kB, MB, GB, TB. PB. For example, "500MB".
       * Supported units with binary prefix: KiB, MiB, GiB, TiB. PiB. These units can also be shortened
         without "iB", e.g. "30G".
   * checkInterval is the interval (in seconds) you want the script to check disk usage.
   * notificationTypes is an array of string values that defines what types of notification should be sent.

     Supported values are: "email", "desktop".
     * Email notifications are sent with options described below.
     * Desktop notifications are shown to the user on desktop. For example, on Windows 10 it uses Windows
       Toast notification.

       **Note**, this only works when running in standalone mode instead of as a system service.
   * email defines options for email notifications.
     * format is the email format. It can be either "html" or "text". "html" is the default value.
     * subject is the email subject. You can use these macros in the defined value:
       * {HOST} - the host machine name
       * {DISK} - the path to the disk being reported (as defined in disks)
       * {THRESHOLD} - the threshold defined for the disk being reported (as defined in disks, but normalized,
         e.g. "4096" => "4096 bytes", "500k" => "500KiB")
       * {THRESHOLDBYTES} - exact # of bytes for defined threshold, which is useful when defined in percentage
       * {TOTAL} - total disk space in bytes
       * {FREE} - remaining free disk space in bytes
       * {AVAILABLE} - available disk space that current user can use, in bytes
     * body is the email body. If using HTML format, it can contain HTML tags. It also supports the same set
       of macros as subject does.
     * from is the from user name/email. Format is "name <email>", or simply an email address.
     * to, cc, bcc are the email recipient. Multiple email addresses can be used with comma as delimiter.
     * smtp defines the SMTP server options used by nodemailer. Please refer to [nodemail's SMTP Transport
       page](https://nodemailer.com/smtp/) for details.
3. Run "npm install". If running on Windows, accept UAC prompts if any (there could be up to 4).

   **Note**, this step installs the script as a system service. If it's not desired, run "npm run uninstall" afterwards.

## To run the script manually:

Run "npm start" or "node src/app.js".

## To install and run the script as a system service:

Run "npm run install" or "node src/install-service.js". If running on Windows, accept UAC prompts if any (there could be up to 4).

**Note**, if settings.json is updated when service is running, restart the server (on Windows, this can be done from Services control panel).

## To uninstall the system service:

Run "npm run uninstall" or "node src/uninstall-service.js". If running on Windows, accept UAC prompts if any (there could be up to 4).
