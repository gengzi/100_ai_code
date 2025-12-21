@ECHO OFF
SETLOCAL

SET "BASEDIR=%~dp0"
IF "%BASEDIR:~-1%"=="\" SET "BASEDIR=%BASEDIR:~0,-1%"
SET "WRAPPER_JAR=%BASEDIR%\.mvn\wrapper\maven-wrapper.jar"

IF NOT EXIST "%WRAPPER_JAR%" (
  ECHO Missing "%WRAPPER_JAR%"
  EXIT /B 1
)

java %MAVEN_OPTS% -Dmaven.multiModuleProjectDirectory="%BASEDIR%" -classpath "%WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain %*

ENDLOCAL
