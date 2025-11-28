@echo off
echo ===================================
echo GEO Platform 数据库备份工具
echo ===================================

:: 设置日期时间格式
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%"
set "Min=%dt:~10,2%"
set "Sec=%dt:~12,2%"

set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"
set "backup_dir=backups"
set "backup_file=%backup_dir%\geodb_backup_%timestamp%.zip"

:: 创建备份目录
if not exist "%backup_dir%" mkdir "%backup_dir%"

:: 备份数据库文件
echo 正在备份数据库...
if exist "data\geodb.mv.db" (
    powershell -command "Compress-Archive -Path 'data\geodb.mv.db' -DestinationPath '%backup_file%' -Force"
    echo 数据库已备份到: %backup_file%
) else (
    echo 数据库文件不存在，跳过备份
)

echo ===================================
echo 备份完成！
echo 备份文件: %backup_file%
echo ===================================

pause