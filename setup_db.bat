@echo off
echo Running database setup and diagnostics...
javac -cp "bin;lib\*" -d bin DBSetup.java
java -cp "bin;lib\*" DBSetup
