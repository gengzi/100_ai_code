@echo off
echo ===================================
echo GEO Platform 数据库清理工具
echo ===================================

echo 警告：此操作将删除所有优化记录和内容数据！
echo.

:: 确认操作
set /p confirm="确定要继续吗？(输入 YES 继续): "
if /i not "%confirm%"=="YES" (
    echo 操作已取消
    pause
    exit /b 0
)

echo.
echo 正在清理数据库...

:: 备份当前数据
echo 1. 备份当前数据...
call database-backup.bat

:: 删除数据库文件
echo 2. 删除数据库文件...
if exist "data\geodb.mv.db" (
    del "data\geodb.mv.db"
    echo   - 数据库文件已删除
)

if exist "data\geodb.trace.db" (
    del "data\geodb.trace.db"
    echo   - 日志文件已删除
)

:: 清理临时文件
echo 3. 清理临时文件...
if exist "temp_restore" rmdir /s /q "temp_restore"
if exist "temp_backup" rmdir /s /q "temp_backup"

echo ===================================
echo 数据库清理完成！
echo 重新启动应用程序将创建新的空数据库
echo ===================================

pause