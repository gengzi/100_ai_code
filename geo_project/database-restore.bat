@echo off
echo ===================================
echo GEO Platform 数据库恢复工具
echo ===================================

set "backup_dir=backups"

:: 检查备份目录是否存在
if not exist "%backup_dir%" (
    echo 备份目录不存在: %backup_dir%
    pause
    exit /b 1
)

:: 列出可用的备份文件
echo 可用的备份文件:
echo.
set count=0
for %%f in ("%backup_dir%\*.zip") do (
    set /a count+=1
    echo !count!. %%~nxf
    set "file!count!=%%f"
)

if %count%==0 (
    echo 没有找到备份文件
    pause
    exit /b 1
)

:: 让用户选择备份文件
echo.
set /p choice="请选择要恢复的备份文件 (1-%count%): "

if %choice% leq 0 goto invalid_choice
if %choice% gtr %count% goto invalid_choice

:: 提取选中的备份文件
call set "selected_file=%%file!choice!%%"
echo.
echo 正在恢复数据库: %selected_file%

:: 创建临时目录
if exist "temp_restore" rmdir /s /q "temp_restore"
mkdir "temp_restore"

:: 解压备份文件
powershell -command "Expand-Archive -Path '%selected_file%' -DestinationPath 'temp_restore' -Force"

:: 停止应用程序（如果正在运行）
echo.
echo 请确保GEO Platform应用程序已停止运行
pause

:: 备份当前数据（如果存在）
if exist "data\geodb.mv.db" (
    echo 备份当前数据库到 temp_backup...
    if not exist "temp_backup" mkdir "temp_backup"
    move "data\geodb.mv.db" "temp_backup\"
)

:: 恢复数据库文件
if exist "temp_restore\data\geodb.mv.db" (
    echo 恢复数据库文件...
    move "temp_restore\data\geodb.mv.db" "data\"
    echo 数据库恢复成功！
) else (
    echo 错误：备份文件中找不到数据库文件
    goto cleanup
)

:: 清理临时文件
:cleanup
echo 清理临时文件...
if exist "temp_restore" rmdir /s /q "temp_restore"

echo ===================================
echo 数据库恢复完成！
echo ===================================

pause
exit /b 0

:invalid_choice
echo 无效的选择
pause
exit /b 1