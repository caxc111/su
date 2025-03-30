@echo off
echo 正在创建 "顺口成章" 项目备份...

set BACKUP_FOLDER=E:\顺口成章\backups
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_NAME=顺口成章_backup_%TIMESTAMP%

echo 备份文件将保存为: %BACKUP_FOLDER%\%BACKUP_NAME%.zip

cd E:\顺口成章
powershell -Command "Compress-Archive -Path app.js,app.json,app.wxss,project.config.json,components,custom-tab-bar,images,pages,styles,utils,README.md -DestinationPath '%BACKUP_FOLDER%\%BACKUP_NAME%.zip' -Force"

echo.
echo 备份完成！文件已保存到: %BACKUP_FOLDER%\%BACKUP_NAME%.zip
echo.

pause 