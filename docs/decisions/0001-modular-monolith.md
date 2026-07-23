# ADR 0001: Use a modular monolith

Status: accepted — July 23, 2026

## Context

Five people have three build days. The product needs one reliable vertical
journey rather than independently deployed services.

## Decision

Use one React app, one FastAPI app organized by business module, and one shared
Firebase project. Keep AI providers behind one interface.

## Consequences

Contracts and integration remain visible, deployment stays simple, and team
members can work by module. Service extraction is deferred until real load or
ownership boundaries justify it.

