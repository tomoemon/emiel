# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

emiel is a universal Japanese typing game library written in pure TypeScript with no external dependencies. It supports various Japanese input methods (Romaji, Kana, AZIK, NICOLA, etc.) and keyboard layouts (QWERTY, Dvorak, Colemak).

## Development Commands

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint

# Publish the package
make publish
```

## Architecture

### Core Components (`/src/core/`)

- **Automaton**: Central class managing word keyboard input for typing games
- **Rule**: Represents input methods (Romaji, Kana input, etc.)
- **KeyboardLayout**: Handles different keyboard layouts (QWERTY JIS/US, Dvorak, etc.)
- **InputEvent/KeyboardState**: Manage keyboard input and state

### Implementation (`/src/impl/`)

- Preset rules and keyboard layouts
- Rule loaders supporting JSON and Mozc format
- Keyboard guide functionality
- Statistics tracking

### Assets (`/src/assets/`)

- Keyboard layout definitions (JSON format)
- Input rule definitions (Mozc-compatible format)
- Keyboard guide images

### Examples (`/examples/`)

Multiple React-based examples demonstrating different features. Each example has its own package.json and can be run independently.

## Key Design Principles

1. **Pure TypeScript**: No external dependencies, framework-agnostic design
2. **Mozc Compatibility**: Full support for Google Japanese Input (Mozc) Romaji table format
3. **Extensibility**: Rules and keyboard layouts can be easily extended via JSON or Mozc format
4. **Browser-First**: Designed for web-based typing games with proper browser compatibility

## Testing

Tests are written using Vitest and located alongside source files with `.test.ts` extension. Focus areas include:

- Rule validation and conversion
- Keyboard input handling
- Automaton state management
- Preset rule correctness

# Note for Claude Code

When working with code in this repository, please ensure to:

- YOU MUST: use `type` instead of `interface` for type definitions
