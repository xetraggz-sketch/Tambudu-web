# ТамБуду — агрегатор городских событий

![CI](https://github.com/xetraggz-sketch/Tambudu/actions/workflows/ci.yml/badge.svg)

**ТамБуду** — это сайт-агрегатор городских событий в Самаре. Находите лекции, мастер-классы, концерты, выставки и другие мероприятия рядом с вами.

---

##  Содержание

- [Возможности](#-возможности)
- [Технологический стек](#-технологический-стек)
- [Требования](#-требования)
- [Быстрый старт](#-быстрый-старт)
- [Подробная инструкция по запуску](#-подробная-инструкция-по-запуску)
- [Переменные окружения](#-переменные-окружения)
- [Скрипты](#-скрипты)
- [Админские команды (CLI)](#-админские-команды-cli)
- [Сборка Android APK](#-сборка-android-apk)
- [Структура проекта](#-структура-проекта)
- [CI/CD](#-cicd)

---

##  Возможности

- **Лента событий** — просмотр всех городских мероприятий с фильтрацией по категориям
- **Карта событий** — интерактивная карта на базе OpenStreetMap
- **Создание событий** — пользователи могут публиковать свои мероприятия
- **Модерация** — админы одобряют/отклоняют события
- **Регистрация на события** — запись на бесплатные и платные мероприятия
- **Баланс и подписка** — внутренняя валюта, подписка для организаторов
- **Продвижение событий** — платное выделение в ленте
- **PWA** — работает как веб-приложение на мобильных устройствах
- **Android-приложение** — нативная обёртка через Capacitor

---

##  Технологический стек

| Категория | Технологии |
|-----------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Стили** | TailwindCSS v4, shadcn/ui (Base UI) |
| **База данных** | PostgreSQL 16, Prisma 7 |
| **Аутентификация** | Auth.js v5 (Credentials provider, JWT) |
| **Карты** | Leaflet, react-leaflet, OpenStreetMap |
| **Мобильное приложение** | Capacitor 8 (Android) |
| **Тестирование** | Vitest (unit), Playwright (e2e) |
| **CI/CD** | GitHub Actions |

---

##  Требования

Перед началом работы убедитесь, что у вас установлены:

| Программа | Версия | Проверка |
|-----------|--------|----------|
| **Node.js** | 20+ | `node -v` |
| **npm** | 10+ | `npm -v` |
| **Docker** | 24+ | `docker -v` |
| **Docker Compose** | 2.20+ | `docker compose version` |
| **Git** | 2.40+ | `git --version` |

Для сборки Android-приложения дополнительно:

| Программа | Версия | Примечание |
|-----------|--------|------------|
| **Android Studio** | Ladybug+ | [Скачать](https://developer.android.com/studio) |
| **Java JDK** | 21 | Входит в Android Studio |

---

##  Быстрый старт

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/xetraggz-sketch/Tambudu.git
cd Tambudu

# 2. Запустите PostgreSQL в Docker
docker compose up -d db

# 3. Создайте файл .env
cp .env.example .env
# Отредактируйте .env (см. раздел "Переменные окружения")

# 4. Установите зависимости
npm install

# 5. Примените миграции и создайте таблицы
npm run db:push

# 6. Заполните базу тестовыми данными (опционально)
npm run db:seed

# 7. Запустите dev-сервер
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

---

##  Подробная инструкция по запуску

### Шаг 1: Клонирование репозитория

```bash
git clone https://github.com/xetraggz-sketch/Tambudu.git
cd Tambudu
```

### Шаг 2: Запуск базы данных PostgreSQL

Проект использует PostgreSQL 16. Самый простой способ — запустить через Docker:

```bash
docker compose up -d db
```

Это создаст контейнер с PostgreSQL со следующими параметрами:
- **Хост:** localhost
- **Порт:** 5432
- **Пользователь:** tambudu
- **Пароль:** tambudu
- **База данных:** tambudu

Проверьте, что контейнер запущен:

```bash
docker ps
# Должен быть виден контейнер tambudu-db-1
```

> **Альтернатива:** Если у вас уже есть PostgreSQL, создайте базу данных вручную и укажите свои параметры в `.env`.

### Шаг 3: Настройка переменных окружения

Скопируйте пример конфигурации:

```bash
cp .env.example .env
```

Откройте файл `.env` и заполните значения:

```env
# Строка подключения к PostgreSQL
DATABASE_URL=postgresql://tambudu:tambudu@localhost:5432/tambudu

# Секретный ключ для JWT (сгенерируйте случайную строку)
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars

# URL приложения
NEXTAUTH_URL=http://localhost:3000

# Данные первого администратора (создаётся при seed)
ADMIN_EMAIL=admin@tambudu.ru
ADMIN_PASSWORD=admin123456
ADMIN_NAME=Администратор

# Город по умолчанию
NEXT_PUBLIC_DEFAULT_CITY=Самара

# Email поддержки (отображается в футере)
NEXT_PUBLIC_SUPPORT_EMAIL=admin@tambudu.ru

# Для мобильного приложения (URL продакшн-сервера)
MOBILE_SERVER_URL=http://localhost:3000
```

> **Важно:** Для генерации `NEXTAUTH_SECRET` используйте:
> ```bash
> openssl rand -base64 32
> ```

### Шаг 4: Установка зависимостей

```bash
npm install
```

Это установит все необходимые пакеты и сгенерирует Prisma Client.

### Шаг 5: Инициализация базы данных

Примените схему Prisma к базе данных:

```bash
npm run db:push
```

Эта команда создаст все таблицы согласно `prisma/schema.prisma`.

### Шаг 6: Заполнение тестовыми данными (опционально)

```bash
# Создаёт админа и тестовых пользователей
npm run db:seed

# Создаёт тестовые события (опционально)
npm run db:seed:events
```

После seed будет создан администратор с данными из `.env`:
- **Email:** значение `ADMIN_EMAIL`
- **Пароль:** значение `ADMIN_PASSWORD`

### Шаг 7: Запуск dev-сервера

```bash
npm run dev
```

Сервер запустится на [http://localhost:3000](http://localhost:3000).

### Шаг 8: Проверка работоспособности

1. Откройте [http://localhost:3000](http://localhost:3000)
2. Перейдите на страницу входа: [http://localhost:3000/login](http://localhost:3000/login)
3. Войдите под админом (данные из `.env`)
4. Проверьте админ-панель: [http://localhost:3000/admin](http://localhost:3000/admin)

---

##  Переменные окружения

| Переменная | Обязательна | Описание | Пример |
|------------|-------------|----------|--------|
| `DATABASE_URL` | Да | Строка подключения PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `NEXTAUTH_SECRET` | Да | Секрет для JWT (мин. 32 символа) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Да | URL приложения | `http://localhost:3000` |
| `ADMIN_EMAIL` | Да | Email первого админа | `admin@tambudu.ru` |
| `ADMIN_PASSWORD` | Да | Пароль первого админа | `admin123456` |
| `ADMIN_NAME` | Нет | Имя первого админа | `Администратор` |
| `NEXT_PUBLIC_DEFAULT_CITY` | Нет | Город по умолчанию | `Самара` |
| `NEXT_PUBLIC_API_BASE_URL` | Нет | Базовый URL API (для Capacitor) | `https://tambudu.ru` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Нет | Email поддержки | `support@tambudu.ru` |
| `MOBILE_SERVER_URL` | Нет | URL для мобильного приложения | `https://tambudu.ru` |

---

##  Скрипты

### Основные команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск dev-сервера (Turbopack) |
| `npm run build` | Сборка для production |
| `npm start` | Запуск production-сервера |
| `npm run lint` | Проверка кода ESLint |
| `npm run typecheck` | Проверка типов TypeScript |
| `npm run format` | Форматирование кода Prettier |

### Тестирование

| Команда | Описание |
|---------|----------|
| `npm run test` | Запуск unit-тестов (Vitest) |
| `npm run test:watch` | Unit-тесты в watch-режиме |
| `npm run test:e2e` | E2E-тесты (Playwright) |

### База данных

| Команда | Описание |
|---------|----------|
| `npm run db:push` | Применить схему к БД (без миграций) |
| `npm run db:migrate` | Создать и применить миграцию |
| `npm run db:studio` | Открыть Prisma Studio (GUI для БД) |
| `npm run db:seed` | Заполнить БД начальными данными |
| `npm run db:seed:events` | Добавить тестовые события |

### Администрирование

| Команда | Описание |
|---------|----------|
| `npm run topup` | Пополнить баланс пользователя |
| `npm run promote` | Назначить/снять админа |
| `npm run users` | Список пользователей |

---

##  Админские команды (CLI)

### Пополнение баланса

```bash
npm run topup -- --email=user@example.com --amount=500 --comment="Бонус"
```

| Флаг | Обязателен | Описание |
|------|------------|----------|
| `--email` | Да | Email пользователя |
| `--amount` | Да | Сумма в рублях (целое число) |
| `--comment` | Нет | Комментарий к транзакции |
| `--yes` | Нет | Пропустить подтверждение |

### Управление админами

```bash
# Назначить админом
npm run promote -- --email=user@example.com

# Снять админство
npm run promote -- --email=user@example.com --demote
```

> **Примечание:** Нельзя снять админство с первого админа (`ADMIN_EMAIL` из `.env`).

### Список пользователей

```bash
# Все пользователи
npm run users

# Поиск по email/имени
npm run users -- --search=ivan

# Ограничить количество
npm run users -- --limit=50
```

---

##  Сборка Android APK

Mobile-приложение работает как WebView-обёртка над веб-сайтом. Требуется интернет-соединение.

### Требования

1. **Android Studio** — [скачать](https://developer.android.com/studio)
2. **Java JDK 21** — входит в Android Studio
3. **Android SDK** — устанавливается вместе с Android Studio

### Подготовка

1. Убедитесь, что в `.env` указан URL продакшн-сервера:
   ```env
   MOBILE_SERVER_URL=https://your-domain.com
   ```

2. Установите зависимости (если ещё не установлены):
   ```bash
   npm install
   ```

### Сборка Debug APK

```bash
# 1. Синхронизируйте Capacitor с Android-проектом
npx cap sync android

# 2. Откройте проект в Android Studio
npx cap open android
```

В Android Studio:

3. Дождитесь завершения Gradle Sync (внизу будет прогресс-бар)
4. Меню: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
5. После сборки появится уведомление с ссылкой на APK

**Путь к APK:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Сборка Release APK (для публикации)

#### 1. Создайте keystore (один раз)

```bash
keytool -genkey -v \
  -keystore tambudu-release.keystore \
  -alias tambudu \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

> **Важно:** Сохраните keystore и пароли в надёжном месте! Без них невозможно обновить приложение в Google Play.

#### 2. Настройте подпись в `android/app/build.gradle`

Добавьте в секцию `android`:

```gradle
android {
    // ...
    
    signingConfigs {
        release {
            storeFile file('../../tambudu-release.keystore')
            storePassword 'your-store-password'
            keyAlias 'tambudu'
            keyPassword 'your-key-password'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 3. Соберите Release APK

В Android Studio:
- Меню: **Build** → **Generate Signed Bundle / APK**
- Выберите **APK**
- Укажите путь к keystore и пароли
- Выберите **release**
- Нажмите **Create**

**Путь к Release APK:**
```
android/app/build/outputs/apk/release/app-release.apk
```

### Установка APK на устройство

#### Через ADB (USB-подключение)

```bash
# Проверьте подключение устройства
adb devices 

# Установите APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

#### Через файловый менеджер

1. Скопируйте APK на устройство
2. Откройте файловый менеджер на устройстве
3. Найдите и нажмите на APK
4. Разрешите установку из неизвестных источников (если требуется)

### Тестирование на эмуляторе

```bash
# Запустите эмулятор из Android Studio или командой:
emulator -avd Pixel_4_API_34

# Установите APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

##  Структура проекта

```
Tambudu/
├── .github/              # GitHub Actions workflows
├── e2e/                  # E2E-тесты (Playwright)
├── prisma/
│   ├── schema.prisma     # Схема базы данных
│   ├── seed.ts           # Seed начальных данных
│   └── seed-events.ts    # Seed тестовых событий
├── public/               # Статические файлы
│   ├── icons/            # Иконки PWA
│   └── manifest.webmanifest
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # Страницы авторизации
│   │   ├── (user)/       # Страницы пользователя
│   │   ├── admin/        # Админ-панель
│   │   ├── api/          # API Routes
│   │   └── layout.tsx    # Корневой layout
│   ├── components/       # React-компоненты
│   │   ├── events/       # Компоненты событий
│   │   ├── layout/       # Header, Footer
│   │   ├── map/          # Карта
│   │   ├── providers/    # Context providers
│   │   ├── ui/           # UI-компоненты (shadcn)
│   │   └── user/         # Компоненты пользователя
│   ├── generated/        # Сгенерированный Prisma Client
│   ├── lib/              # Утилиты и бизнес-логика
│   │   ├── __tests__/    # Unit-тесты
│   │   ├── schemas/      # Zod-схемы валидации
│   │   └── ...
│   ├── scripts/          # CLI-скрипты (topup, promote)
│   └── types/            # TypeScript типы
├── .env.example          # Пример переменных окружения
├── capacitor.config.ts   # Конфигурация Capacitor
├── docker-compose.yml    # Docker Compose для PostgreSQL
├── package.json
└── README.md
```

---

##  CI/CD

### GitHub Actions

На каждый Pull Request в `main` запускаются:

| Job | Описание |
|-----|----------|
| **quality** | unit-тесты |
| **e2e** | Playwright E2E-тесты (Chromium) |

### Сборка Android APK

Автоматическая сборка APK:
- **Вручную:** Actions → Build Android APK → Run workflow
- **Автоматически:** При пуше тега `v*` (например, `v1.0.0`)

---

##  Разработка

### Запуск тестов

```bash
# Unit-тесты
npm run test

# E2E-тесты (требуется запущенный dev-сервер)
npm run dev &
npm run test:e2e
```

### Проверка кода перед коммитом

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

### Prisma Studio

Для просмотра и редактирования данных в БД:

```bash
npm run db:studio
```

Откроется [http://localhost:5555](http://localhost:5555).

---
