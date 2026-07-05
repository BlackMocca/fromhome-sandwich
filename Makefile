# =============================================================================
# From Home Sandwich — Supabase Migrations (CLI Only)
# =============================================================================
# อ่าน credential จาก .env ใน root ของ project (ไม่มี Next.js vars)
# =============================================================================

.PHONY: migrate migrate-up migrate-down db-push db-reset help link db-seed \
        migration-list db-status db-up db-down schema-diff schema-pull login

# ─── Environment Setup (load from .env if available) ────────────────────────

ENV_FILE := $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))/.env
-include $(ENV_FILE)

SUPABASE_URL       ?= https://fromhome-sandwich.supabase.co
SUPABASE_ACCESS_TOKEN := ${SUPABASE_ACCESS_TOKEN}
ANON_KEY           := ${ANON_KEY}
SERVICE_KEY        := ${SERVICE_KEY}

# ─── Check CLI & Credentials ────────────────────────────────────────────────

CHECK_CLI := $(shell command -v supabase 2>/dev/null)
ifeq ($(CHECK_CLI),)
$(warning WARNING: supabase CLI not found. Install with: npm i -g supabase)
endif

# ตรวจสอบว่า credential เป็น placeholder หรือไม่
is_placeholder = $(shell echo $1 | grep -qE '<YOUR|your' && echo yes || echo no)

check-credentials:
	@echo "📋 Checking credentials..."
	@echo ""; \
	for var in SUPABASE_ACCESS_TOKEN ANON_KEY SERVICE_KEY; do \
		val=$$(eval $$var); \
		echo "$$var = $${val}"; \
	done; \
	if [ "$(call is_placeholder,$(SUPABASE_ACCESS_TOKEN))" = "yes" ] && \
	   [ "$(call is_placeholder,$(ANON_KEY))" = "yes" ] && \
	   [ "$(call is_placeholder,$(SERVICE_KEY))" = "yes" ]; then \
		echo "\n⚠️  ทุกค่าเป็น placeholder — เติมใน .env แล้วรันใหม่"; \
	fi

# ─── Migrations ─────────────────────────────────────────────────────────────

## migrate: รัน migration ทั้งหมด (push ไป cloud + seed data)
migrate: db-push db-seed
	@echo ""; \
	echo "✅ Migration เสร็จสิ้น! ตาราง categories พร้อมใช้งาน"

## db-push: ดัน migration files ที่เขียนไว้ขึ้น Supabase Cloud
db-push: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  🚀 Pushing migrations to cloud..."
	@echo "═══════════════════════════════════════════"
	@echo ""
	@echo "📍 URL: $(SUPABASE_URL)"
	@echo "🔑 ANON_KEY:   $$(echo $$ANON_KEY | cut -c1-20)...[${#ANON_KEY} chars]"
	@echo "🔑 SERVICE_KEY: $$(echo $$SERVICE_KEY | cut -c1-20)...[${#SERVICE_KEY} chars]"
	@echo ""
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "❌ .env file not found"; \
		exit 1; \
	fi
	supabase db push

## migrate-up: รัน migration ใหม่ที่ยังไม่ถูก push ไปแล้ว
migrate-up: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  ⬆️  Applying pending migrations..."
	@echo "═══════════════════════════════════════════"
	supabase migration up

## migrate-down: ถอยหลัง migration 1 ขั้น
migrate-down: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  ⬇️  Rolling back last migration..."
	@echo "═══════════════════════════════════════════"
	supabase migration down

## db-reset: reset database กลับไปสถานะล่าสุด (push schema ใหม่ทั้งหมด)
db-reset: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  🔄 Resetting database..."
	@echo "═══════════════════════════════════════════"
	supabase db reset

## migration-list: แสดงรายการ migration ทั้งหมด (ที่ push แล้ว + ที่รอดัน)
migration-list: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  📋 Migration List"
	@echo "═══════════════════════════════════════════"
	supabase migration list

## db-status: ตรวจสอบสถานะ connection กับ Supabase Cloud
db-status: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  📡 Supabase Connection Status"
	@echo "═══════════════════════════════════════════"
	supabase status

# ─── Seed Data ──────────────────────────────────────────────────────────────

## db-seed: รัน seed data จากไฟล์ SQL ใน supabase/seed.sql
db-seed: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  🌱 Seeding database..."
	@echo "═══════════════════════════════════════════"
	supabase db seed

# ─── Local Development ──────────────────────────────────────────────────────

## db-up: เริ่ม Supabase local dev server (Docker)
db-up:
	supabase start

## db-down: หยุด Supabase local dev server
db-down:
	supabase stop

# ─── Link & Auth ────────────────────────────────────────────────────────────

## link: เชื่อมต่อ CLI กับ Supabase Cloud project
link: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  🔗 Linking to Supabase Cloud..."
	@echo "═══════════════════════════════════════════"
	supabase link --project-ref fromhome-sandwich

## login: Login เข้า Supabase CLI (สำหรับคนแรก)
login:
	supabase login --no-browser

# ─── Schema Management ──────────────────────────────────────────────────────

## schema-diff: ดูความแตกต่างระหว่าง local กับ cloud schema
schema-diff: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  🔍 Schema Diff (local ↔ cloud)"
	@echo "═══════════════════════════════════════════"
	supabase db diff

## schema-pull: ดึง schema ล่าสุดจาก cloud มาลง local
schema-pull: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  ⬇️  Pulling schema from cloud..."
	@echo "═══════════════════════════════════════════"
	supabase db pull

# ─── Help ───────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "╔═══════════════════════════════════════════╗"
	@echo "║  From Home Sandwich — Supabase Migrations ║"
	@echo "╚═══════════════════════════════════════════╝"
	@echo ""
	@echo "📍 URL:     $(SUPABASE_URL)"
	@echo "🔑 ANON_KEY:    $$(echo $$ANON_KEY | cut -c1-20)..."
	@echo "🔑 SERVICE_KEY:  $$(echo $$SERVICE_KEY | cut -c1-20)..."
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "Commands:"
	@echo ""
	@echo "  🚀 Migrations:"
	@echo "    migrate        รัน migration ทั้งหมด (push + seed)"
	@echo "    db-push        ดัน migration ขึ้น Cloud"
	@echo "    migrate-up     รัน migration ใหม่ที่ยังไม่ถูก push"
	@echo "    migrate-down   ถอยหลัง migration 1 ขั้น"
	@echo "    db-reset       Reset database กลับไปสถานะล่าสุด"
	@echo "    migration-list แสดงรายการ migration ทั้งหมด"
	@echo "    db-status      ตรวจสอบ connection status"
	@echo ""
	@echo "🌱 Data:"
	@echo "    db-seed        รัน seed data"
	@echo ""
	@echo "🔧 Link & Auth:"
	@echo "    link           เชื่อมต่อ CLI กับ Cloud project"
	@echo "    login          Login เข้า Supabase CLI"
	@echo ""
	@echo "⚙️  Local Dev:"
	@echo "    db-up          เริ่ม local dev server (Docker)"
	@echo "    db-down        หยุด local dev server"
	@echo ""
	@echo "📊 Schema:"
	@echo "    schema-diff    ดู diff ระหว่าง local กับ cloud"
	@echo "    schema-pull    ดึง schema จาก cloud มาลง local"
	@echo ""
