# =============================================================================
# From Home Sandwich — Supabase Migrations (CLI Only)
# สอดคล้องกับ cmd.sh
# =============================================================================

.PHONY: migrate login link db-push db-seed migration-list db-status \
        migrate-up migrate-down db-reset db-up db-down schema-diff \
        schema-pull help reset-token

# ─── Environment Setup (load from .env if available) ────────────────────────

ENV_FILE := $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))/.env
-include $(ENV_FILE)

SUPABASE_URL       ?= https://$(PROJECT_REF).supabase.co
PROJECT_REF        ?= ${PROJECT_REF}
PROFILE_NAME       ?= ${PROFILE_NAME}
SUPABASE_ACCESS_TOKEN := ${SUPABASE_ACCESS_TOKEN}
TABLENAME		   ?= new_migrations

# ─── Check CLI & Credentials ────────────────────────────────────────────────

CHECK_CLI := $(shell command -v supabase 2>/dev/null)
ifeq ($(CHECK_CLI),)
$(warning WARNING: supabase CLI not found. Install with: npm i -g supabase)
endif

# ─── Migrations (รูปแบบเดียวกับ cmd.sh) ──────────────────────────────────────

## migrate: รัน migration ทั้งหมด (push + seed) — สอดคล้องกับ cmd.sh
migrate: db-push db-seed
	@echo ""; \
	echo "✅ Migration เสร็จสิ้น! ตาราง categories พร้อมใช้งาน"

## login: Login เข้า Supabase CLI ด้วย token ที่ระบุใน cmd.sh
login:
	@echo "═══════════════════════════════════════════"
	@echo "  🔐 Logging in to Supabase..."
	@echo "═══════════════════════════════════════════"
	supabase login --token $(SUPABASE_ACCESS_TOKEN) --debug --output-format json

## link: เชื่อมต่อ CLI กับ Cloud project (รูปแบบเดียวกับ cmd.sh)
link:
	@echo "═══════════════════════════════════════════"
	@echo "  🔗 Linking to Supabase Cloud..."
	@echo "═══════════════════════════════════════════"
	SUPABASE_ACCESS_TOKEN=$(SUPABASE_ACCESS_TOKEN) supabase link --project-ref $(PROJECT_REF) --output-format json --output json

## db-push: ดัน migration files ขึ้น Cloud (รูปแบบเดียวกับ cmd.sh)
db-push: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  🚀 Pushing migrations to cloud..."
	@echo "═══════════════════════════════════════════"
	supabase db push --yes --debug

## migrate-new: สร้าง migration file ใหม่ 
migrate-new: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  ⬆️  New migrations... file"
	@echo "═══════════════════════════════════════════"
	supabase migration new $(TABLENAME)

## migrate-up: รัน migration ใหม่ที่ยังไม่ถูก push
migrate-up: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  ⬆️  Applying pending migrations..."
	@echo "═══════════════════════════════════════════"
	supabase migration up --yes

## migrate-down: ถอยหลัง migration 1 ขั้น
migrate-down: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  ⬇️  Rolling back last migration..."
	@echo "═══════════════════════════════════════════"
	supabase migration down --yes

## db-reset: reset database กลับไปสถานะล่าสุด
db-reset: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  🔄 Resetting database..."
	@echo "═══════════════════════════════════════════"
	supabase db reset --yes

## migration-list: แสดงรายการ migration ทั้งหมด
migration-list: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  📋 Migration List"
	@echo "═══════════════════════════════════════════"
	supabase migration list --yes

## db-status: ตรวจสอบสถานะ connection กับ Supabase Cloud
db-status: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  📡 Supabase Connection Status"
	@echo "═══════════════════════════════════════════"
	supabase status --yes

# ─── Seed Data ──────────────────────────────────────────────────────────────

## db-seed: รัน seed data จากไฟล์ SQL ใน supabase/seed.sql
db-seed: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  🌱 Seeding database..."
	@echo "═══════════════════════════════════════════"
	supabase db seed --yes

# ─── Local Development ──────────────────────────────────────────────────────

## db-up: เริ่ม Supabase local dev server (Docker)
db-up:
	supabase start

## db-down: หยุด Supabase local dev server
db-down:
	supabase stop

# ─── Schema Management ──────────────────────────────────────────────────────

## schema-diff: ดูความแตกต่างระหว่าง local กับ cloud schema
schema-diff: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  🔍 Schema Diff (local ↔ cloud)"
	@echo "═══════════════════════════════════════════"
	SUPABASE_ACCESS_TOKEN=$(SUPABASE_ACCESS_TOKEN) supabase db diff

## schema-pull: ดึง schema ล่าสุดจาก cloud มาลง local
schema-pull: $(ENV_FILE)
	@echo "═══════════════════════════════════════════"
	@echo "  ⬇️  Pulling schema from cloud..."
	@echo "═══════════════════════════════════════════"
	SUPABASE_ACCESS_TOKEN=$(SUPABASE_ACCESS_TOKEN) supabase db pull

function-deploy:
	@echo "═══════════════════════════════════════════"
	@echo "  ⬇️  Deploy Functions from cloud..."
	@echo "═══════════════════════════════════════════"
	supabase functions deploy --debug 

# ─── Help ───────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "╔═══════════════════════════════════════════╗"
	@echo "║  From Home Sandwich — Supabase Migrations ║"
	@echo "╚═══════════════════════════════════════════╝"
	@echo ""
	@echo "📍 Project: $(PROJECT_REF)"
	@echo "🔗 URL:     $(SUPABASE_URL)"
	@echo "👤 Profile: $(PROFILE_NAME)"
	@echo "🔐 Token:   $$(if [ "$(SUPABASE_ACCESS_TOKEN)" != "" ]; then echo 'SET'; else echo 'UNSET ⚠️'; fi)"
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "Commands (รูปแบบเดียวกับ cmd.sh):"
	@echo ""
	@echo "  🔐 Auth & Link:"
	@echo "    login          Login ด้วย token ใน .env"
	@echo "    link           เชื่อมต่อ CLI กับ Cloud project"
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
	@echo "  📊 Schema:"
	@echo "    schema-diff    ดู diff ระหว่าง local กับ cloud"
	@echo "    schema-pull    ดึง schema จาก cloud มาลง local"
	@echo ""
	@echo "  ⚙️  Local Dev:"
	@echo "    db-up          เริ่ม local dev server (Docker)"
	@echo "    db-down        หยุด local dev server"
	@echo ""
