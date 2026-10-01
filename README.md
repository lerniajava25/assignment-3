# Assignment 3 - System Architecture

Jakarta EE 11, Java 21 och WildFly 41. Maven-projektet ligger direkt i denna rotmapp.

## Starta lokalt på Windows

Kör från projektmappen i PowerShell:

```powershell
.\start.cmd
```

Du kan också dubbelklicka på `start.cmd`. Startfilen hittar Java 21 via
`JAVA_HOME`, IntelliJs `.jdks`-mapp eller Java på `Path`.
Maven bygger appen, hämtar WildFly till `target/server`, startar servern och
deployar appen. Första starten behöver internet och kan ta några minuter.
Du behöver inte starta din separat installerade WildFly eller kopiera WAR-filer.
Stoppa en eventuell tidigare WildFly med Ctrl+C först, så att portarna 8080 och 9990 är lediga.

Öppna http://localhost:8080/api/hello-world – svaret ska vara `Hello, World!`.
Stoppa med Ctrl+C. Efter kodändringar stoppar du och kör startfilen igen.

## IntelliJ

Öppna rotmappens `pom.xml` som Maven-projekt (eller välj Add as Maven Project)
och använd JDK 21. Synkronisera Maven efter flytten från `uppgift-3`.

Om Java redan är konfigurerat i terminalen kan du även köra direkt:

```powershell
.\mvnw.cmd wildfly:run
```

Bygg utan att starta servern med `.\mvnw.cmd clean verify`.
