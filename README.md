```mermaid
flowchart TD
    A[Milk Depot Management System]

    %% Frontend
    A --> B[Frontend Layer]

    B --> B1[Pages]
    B1 --> P1[index.html<br/>Data Entry]
    B1 --> P2[dashboard.html<br/>Dashboard]
    B1 --> P3[reports.html<br/>Reports]
    B1 --> P4[advance.html<br/>Advance Management]

    B --> B2[CSS Layer]
    B2 --> C1[style.base.css]
    B2 --> C2[style.responsive.css]
    B2 --> C3[ui-enhancements.css]

    B --> B3[JavaScript Layer]
    B3 --> J1[app.js]
    B3 --> J2[dashboard.js]
    B3 --> J3[reports.js]
    B3 --> J4[advance.js]
    B3 --> J5[shared.js]
    B3 --> J6[theme-toggle.js]

    %% Backend
    A --> C[Backend Layer]

    C --> C0[FastAPI App]
    C0 --> C1[main.py]

    C0 --> C2[API Modules]
    C2 --> API1[members.py]
    C2 --> API2[sessions.py]
    C2 --> API3[entries.py]
    C2 --> API4[reports.py]

    C0 --> C3[Core Services]
    C3 --> CS1[config.py]
    C3 --> CS2[database.py]

    C0 --> C4[Data Models]
    C4 --> M1[schemas.py]

    %% Reporting
    C --> D[Reporting Engine]
    D --> D1[LaTeX Templates]
    D1 --> D2[fortnight_report.tex.j2]
    D --> D3[Fonts]
    D3 --> D4[Noto Sans Telugu]

    %% Support Files
    A --> E[Project Support]
    E --> E1[requirements.txt]
    E --> E2[.env]
    E --> E3[README.md]
    E --> E4[.gitignore]
 ```
