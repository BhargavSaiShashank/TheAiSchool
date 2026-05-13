const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../pulsesend-api-docs');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ==============================================
// 🚀 OpenAPI Spec Definition
// ==============================================

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "PulseSend Email Campaign Platform API",
    description: "Official API Specification for PulseSend. Provides administrative control, contact handling, template management, analytics harvesting, and multi-tenant isolation hooks.",
    version: "1.0.0",
    contact: {
      name: "PulseSend Engineering",
      email: "dev@pulsesend.com"
    }
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development Sandbox"
    },
    {
      url: "https://api.pulsesend.com",
      description: "Production API Server"
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "Secure access token provided by Clerk authentication."
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "Unauthorized access" }
        }
      },
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true }
        }
      },
      Campaign: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Holiday Blast" },
          subject: { type: "string", example: "Season's Greetings!" },
          previewText: { type: "string" },
          fromName: { type: "string", example: "PulseSend Team" },
          fromEmail: { type: "string", example: "hello@pulsesend.com" },
          status: { type: "string", enum: ["draft", "scheduled", "sending", "sent"], example: "draft" },
          templateId: { type: "string", format: "uuid" },
          recipientsConfig: { type: "string", description: "JSON string containing recipient criteria" },
          scheduledAt: { type: "string", format: "date-time" },
          timezone: { type: "string", example: "Asia/Kolkata" }
        }
      },
      Contact: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email", example: "john.doe@example.com" },
          firstName: { type: "string", example: "John" },
          lastName: { type: "string", example: "Doe" },
          status: { type: "string", enum: ["active", "unsubscribed", "bounced", "complained"], example: "active" },
          company: { type: "string", example: "Acme Corp" },
          city: { type: "string", example: "New York" },
          jobTitle: { type: "string", example: "Marketing Lead" },
          listIds: { type: "array", items: { type: "string", format: "uuid" } }
        }
      },
      ContactList: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "VIP Newsletter" },
          description: { type: "string", example: "High-value leads" },
          count: { type: "integer", example: 450 },
          tags: { type: "array", items: { type: "string" }, example: ["Marketing", "Enterprise"] }
        }
      },
      Template: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Black Friday Sale" },
          category: { type: "string", example: "E-commerce" },
          content: { type: "string", description: "JSON content blocks" },
          html: { type: "string", description: "Compiled static HTML" },
          thumbnail: { type: "string", format: "uri" }
        }
      },
      SuppressionItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          reason: { type: "string", enum: ["bounced", "complained", "manual"] },
          date: { type: "string", example: "2 days ago" },
          log: { type: "string" }
        }
      }
    }
  },
  security: [
    { BearerAuth: [] }
  ],
  paths: {
    "/api/admin/reset-db": {
      post: {
        tags: ["Admin"],
        summary: "Force Database Purge",
        description: "Permanently wipes all sandbox environment datasets (Campaigns, Contacts, Lists, Segments, Templates) to facilitate local reset. Extreme caution advised.",
        responses: {
          200: {
            description: "Successfully wiped",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          500: { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Standard Direct Authenticate",
        description: "Acquires valid application profile credentials via standard internal email authentication hook.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Success Login Token Return",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    email: { type: "string" },
                    role: { type: "string" },
                    org_id: { type: "string" },
                    org_name: { type: "string" }
                  }
                }
              }
            }
          },
          401: { description: "Invalid Credentials" }
        }
      }
    },
    "/api/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Initial Corporate Sign Up Pipeline",
        description: "Bootstraps a completely new root organization tenant, allocated SUPER_ADMIN root profile, and isolation boundaries simultaneously.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "orgName"],
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                  orgName: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Registration finalized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } }
          }
        }
      }
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Validate Identity Token & Retrieve Active Session Payload",
        description: "Critical session verification pipeline routing user authorization to their exact active multi-tenant org container, performing self-healing profile creation if necessary.",
        responses: {
          200: {
            description: "Self context returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    email: { type: "string" },
                    role: { type: "string" },
                    org_id: { type: "string" },
                    org_name: { type: "string" },
                    aws_region: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/campaigns": {
      get: {
        tags: ["Campaigns"],
        summary: "Retrieve Campaign Inventory Catalog",
        description: "Harvests the complete list of active, scheduled, sent, and draft campaigns bound exclusively to the user's organizational limits.",
        responses: {
          200: {
            description: "List of Campaign Models",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Campaign" }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Campaigns"],
        summary: "Orchestrate New Communication Campaign",
        description: "Defines a fresh dynamic campaign template container inside active tenancy. Triggers AWS SQS queues immediately if set to sent.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Campaign" }
            }
          }
        },
        responses: {
          200: {
            description: "Created Successfully",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Campaign" } } }
          }
        }
      },
      put: {
        tags: ["Campaigns"],
        summary: "Mutate Existing Campaign Blueprint",
        parameters: [
          { name: "id", in: "query", required: true, schema: { type: "string" }, description: "Identifier UUID" }
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Campaign" } } }
        },
        responses: { 200: { description: "Updated Success" } }
      },
      delete: {
        tags: ["Campaigns"],
        summary: "Eradicate Campaign Permanently",
        parameters: [
          { name: "id", in: "query", required: true, schema: { type: "string" } }
        ],
        responses: { 200: { description: "Deleted Successfully" } }
      }
    },
    "/api/campaigns/{id}/report": {
      get: {
        tags: ["Analytics"],
        summary: "Forensic Campaign Report Aggregator",
        description: "Runs intensive aggregate logic yielding timeline events, click charts, device breakdown distributions, and bounce counts for specific campaigns.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Target Campaign ID" }
        ],
        responses: {
          200: {
            description: "Unified statistics report returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    campaign: { type: "object" },
                    metrics: { type: "object" },
                    charts: { type: "object" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/analytics": {
      get: {
        tags: ["Analytics"],
        summary: "Historical Performance Analytics Pipeline",
        description: "Extracts aggregate user-agent breakdowns and high-fidelity click attribution distributions for visual timeline renders.",
        parameters: [
          { name: "id", in: "query", required: false, schema: { type: "string" }, description: "Campaign ID (Optional, lists all sent campaigns if omitted)" }
        ],
        responses: { 200: { description: "Analytical arrays returned" } }
      }
    },
    "/api/dashboard": {
      get: {
        tags: ["Analytics"],
        summary: "Operational Command Console Baseline Telemetry",
        description: "Quantum leap concurrent query engine retrieving absolute global counts (Audience, Sent, Open, Clicks) and rolling 7-day volume trajectories simultaneously.",
        responses: {
          200: {
            description: "Dashboard layout state data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    stats: { type: "object" },
                    liveActivities: { type: "array", items: { type: "object" } },
                    topCampaigns: { type: "array", items: { type: "object" } },
                    performanceData: { type: "array", items: { type: "object" } }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/contacts": {
      get: {
        tags: ["Contacts"],
        summary: "Harvest Isolation-Safe Contacts Manifest",
        responses: {
          200: {
            description: "Contact collection",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Contact" } } } }
          }
        }
      },
      post: {
        tags: ["Contacts"],
        summary: "Inject Manual Subscriber Record",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string" },
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  status: { type: "string" },
                  company: { type: "string" },
                  city: { type: "string" },
                  jobTitle: { type: "string" },
                  listId: { type: "string" },
                  customFields: { type: "object" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Contact registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Contact" }
              }
            }
          }
        }
      }
    },
    "/api/contacts/import": {
      post: {
        tags: ["Contacts"],
        summary: "Execute High-Velocity CSV Stream Ingestion",
        description: "Ingests highly parallel array parsing payloads to batch-upsert rows against strict unique email indexes within physical container parameters.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["contacts"],
                properties: {
                  contacts: { type: "array", items: { type: "object" } },
                  listId: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Resulting ingestion outcome statistics object returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    added: { type: "integer" },
                    updated: { type: "integer" },
                    errored: { type: "integer" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/contacts/timeline": {
      get: {
        tags: ["Contacts"],
        summary: "Forensic Engagement Trace Stream",
        description: "Assembles comprehensive email event historical markers (opened, clicked, etc.) belonging exclusively to target contact instance.",
        parameters: [
          { name: "contactId", in: "query", required: true, schema: { type: "string" } }
        ],
        responses: { 200: { description: "Array of log traces" } }
      }
    },
    "/api/lists": {
      get: {
        tags: ["Lists"],
        summary: "Collate Active Segmentation Vault Structures",
        responses: { 200: { description: "Array of target contact lists", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ContactList" } } } } } }
      },
      post: {
        tags: ["Lists"],
        summary: "Provision Clean List Target Container",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" }, description: { type: "string" } } } } }
        },
        responses: { 200: { description: "List object yielded", content: { "application/json": { schema: { $ref: "#/components/schemas/ContactList" } } } } }
      },
      put: {
        tags: ["Lists"],
        summary: "Modify Meta-Descriptors",
        parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { 200: { description: "Successful update return" } }
      },
      delete: {
        tags: ["Lists"],
        summary: "Irreversible List Cascade Annihilation",
        description: "Safely executes atomic cascading memberships extraction prior to eradicating parent segmentation container completely.",
        parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Successfully removed" } }
      }
    },
    "/api/lists/members": {
      post: {
        tags: ["Lists"],
        summary: "Bind Multiple Recipients To Structural Container",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["listId", "contactIds"],
                properties: { listId: { type: "string" }, contactIds: { type: "array", items: { type: "string" } } }
              }
            }
          }
        },
        responses: { 200: { description: "Bindings written" } }
      }
    },
    "/api/lists/members/bulk": {
      post: {
        tags: ["Lists"],
        summary: "Execute High-Throughput Relational Actions",
        description: "High-speed operation executing bulk binding ('add'), batch exclusion ('remove'), or literal hard erasure ('delete') across contact lists.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["contactIds", "action"],
                properties: {
                  contactIds: { type: "array", items: { type: "string" } },
                  listId: { type: "string" },
                  action: { type: "string", enum: ["add", "remove", "delete"] }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Batch completed" } }
      }
    },
    "/api/org": {
      get: {
        tags: ["Organization"],
        summary: "Acquire Corporate Identity Registry Metadata",
        description: "Fetches current enterprise limits including integrated AWS SES Regions and configured Config Sets. Restricted strictly to SUPER_ADMIN clearances.",
        responses: {
          200: {
            description: "Configuration metadata bundle",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    fromEmail: { type: "string" },
                    region: { type: "string" },
                    configSet: { type: "string" }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Organization"],
        summary: "Patch Secure Multi-Tenant Integration Variables",
        description: "Authoritative injection routing global environment hooks (AWS, Mail Identifiers, Logos) directly to mapped context containers safely.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  fromEmail: { type: "string" },
                  region: { type: "string" },
                  configSet: { type: "string" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Variables integrated" } }
      }
    },
    "/api/segments": {
      get: {
        tags: ["Segments"],
        summary: "Retrieve Rule-Based Segmentation Criteria Inventory",
        responses: { 200: { description: "Array of segments returned" } }
      },
      post: {
        tags: ["Segments"],
        summary: "Archive Fresh Query Segment Specification",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "rules"],
                properties: { name: { type: "string" }, rules: { type: "object" } }
              }
            }
          }
        },
        responses: { 200: { description: "Successful definition archival" } }
      }
    },
    "/api/send-test": {
      post: {
        tags: ["Campaigns"],
        summary: "Fire Solo Live Diagnostic Despatch",
        description: "Direct, non-pipeline AWS SES execution allowing super-administrators to fire physical debug emails outside normal reporting workflows.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["to", "subject"],
                properties: {
                  to: { type: "string", format: "email" },
                  subject: { type: "string" },
                  html: { type: "string" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Fired via AWS SES SMTP gateway" } }
      }
    },
    "/api/suppression": {
      get: {
        tags: ["Suppression & Security"],
        summary: "Inspect Global Isolation Blacklist Registry",
        description: "Retrieves current comprehensive database list of globally-quarantined identifiers (Hard Bounces, Complaints, Manual Additions).",
        responses: {
          200: {
            description: "Blacklist manifest output",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/SuppressionItem" } } } }
          }
        }
      },
      post: {
        tags: ["Suppression & Security"],
        summary: "Enforce Quarantine State Manually",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "reason"],
                properties: { email: { type: "string" }, reason: { type: "string" }, log: { type: "string" } }
              }
            }
          }
        },
        responses: { 200: { description: "Successfully blacklisted" } }
      },
      delete: {
        tags: ["Suppression & Security"],
        summary: "Pardon & Erase Quarantined Entity",
        parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Restored eligibility status successfully" } }
      }
    },
    "/api/templates": {
      get: {
        tags: ["Templates"],
        summary: "Harvest Active Multi-Tenant Template Collection",
        responses: {
          200: {
            description: "Inventory collection data returned",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Template" } } } }
          }
        }
      },
      post: {
        tags: ["Templates"],
        summary: "Commit Dynamic Unlayer Design State Data",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  id: { type: "string", description: "Optional. Existing UUID to perform update instead of create" },
                  name: { type: "string" },
                  category: { type: "string" },
                  content: { type: "string", description: "Unlayer block schema state payload string" },
                  html: { type: "string" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Layout saved successfully" } }
      },
      delete: {
        tags: ["Templates"],
        summary: "Excise Template Entry",
        parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Design permanently deleted" } }
      }
    },
    "/api/users": {
      get: {
        tags: ["Users & Access Control"],
        summary: "List Organizational Seat Occupants",
        responses: { 200: { description: "Active manifest output" } }
      },
      post: {
        tags: ["Users & Access Control"],
        summary: "Provision New Organization Seat Profile",
        description: "Forces preliminary relational allocation mapped to active tenant ID context, spawning pre-authenticated pending Clerk hooks.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "role"],
                properties: { email: { type: "string" }, role: { type: "string", enum: ["SUPER_ADMIN", "CAMPAIGN_MANAGER", "VIEWER"] } }
              }
            }
          }
        },
        responses: { 200: { description: "Seat provisioned" } }
      },
      put: {
        tags: ["Users & Access Control"],
        summary: "Elevate or Restrict Occupant Clearance Roles",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["id", "role"],
                properties: { id: { type: "string" }, role: { type: "string" } }
              }
            }
          }
        },
        responses: { 200: { description: "RBAC role patched" } }
      },
      delete: {
        tags: ["Users & Access Control"],
        summary: "Evict Member Profile Permanently",
        parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Tenant seat purged" } }
      }
    },
    "/api/upload": {
      post: {
        tags: ["Media & Files"],
        summary: "Direct Binary File/Blob Ingest to Cloud Storage",
        description: "Processes base64-encoded assets stream payloads, streaming directly to configured physical AWS S3 storage pools.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["file"],
                properties: { file: { type: "string", description: "Base64 string" }, fileName: { type: "string" }, fileType: { type: "string" } }
              }
            }
          }
        },
        responses: {
          200: {
            description: "File saved",
            content: { "application/json": { schema: { type: "object", properties: { url: { type: "string", format: "uri" } } } } }
          }
        }
      }
    },
    "/api/cron/process-schedule": {
      get: {
        tags: ["System Automation"],
        summary: "Execute Cron Dispatcher Synchronization",
        description: "Secured system automation trigger looping over scheduled queues, transitioning ready items into sending state and routing tasks to AWS SQS execution grids.",
        responses: { 200: { description: "Cron cycle executed and released" } }
      }
    },
    "/api/unsubscribe": {
      post: {
        tags: ["Compliance Pipelines"],
        summary: "Execute Legal Opt-Out Compliance Sequence",
        description: "Parses hashed/combined unique UID tokens, forcing recipient mapping state to 'unsubscribed' and generating detailed EmailEvent logging automatically.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["uid"],
                properties: { uid: { type: "string", example: "contactUuid_campaignUuid" } }
              }
            }
          }
        },
        responses: { 200: { description: "Opt-out complete" } }
      },
      put: {
        tags: ["Compliance Pipelines"],
        summary: "Rollback Suppression Eligibility Sequence",
        description: "Manually toggles target identity state back from quarantine into regular 'active' pool status.",
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["uid"], properties: { uid: { type: "string" } } } } }
        },
        responses: { 200: { description: "Re-eligibility restored successfully" } }
      }
    },
    "/api/preferences": {
      get: {
        tags: ["Compliance Pipelines"],
        summary: "Fetch Recipient-Facing Preferences Grid State",
        security: [],
        parameters: [{ name: "uid", in: "query", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Full list structure with existing memberships delivered" } }
      },
      post: {
        tags: ["Compliance Pipelines"],
        summary: "Bulk Sync Subscription Directives",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["uid", "listIds"],
                properties: { uid: { type: "string" }, listIds: { type: "array", items: { type: "string" } } }
              }
            }
          }
        },
        responses: { 200: { description: "List directives synchronized" } }
      }
    },
    "/track/click": {
      get: {
        tags: ["Telemetry Tracking Hooks"],
        summary: "Facilitate Live Traffic Click Redirection & Attribution",
        security: [],
        description: "Captures temporal click context (IP, UA, UUID) then executes immediate background logging processes BEFORE firing atomic HTTP 302 redirects to preserve performance.",
        parameters: [
          { name: "uid", in: "query", required: true, schema: { type: "string" } },
          { name: "url", in: "query", required: true, schema: { type: "string" } }
        ],
        responses: { 302: { description: "Immediate browser redirect to absolute destination URL" } }
      }
    },
    "/track/open": {
      get: {
        tags: ["Telemetry Tracking Hooks"],
        summary: "Deliver Transparent Core Tracking Pixel Node",
        security: [],
        description: "Fires immediate 1x1 transparent GIF buffer payload while executing background logging routines asynchronously.",
        parameters: [
          { name: "uid", in: "query", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Base64 pixel node",
            content: { "image/gif": { schema: { type: "string", format: "binary" } } }
          }
        }
      }
    },
    "/api/webhooks/clerk": {
      post: {
        tags: ["Webhooks Gateway"],
        summary: "Svix Clerk Core Event Ingest",
        security: [],
        description: "Listens directly to Clerk Auth provider event webhooks to sync system user definitions and organizational mirror containers.",
        responses: { 200: { description: "Event resolved successfully" } }
      }
    },
    "/api/webhooks/ses": {
      post: {
        tags: ["Webhooks Gateway"],
        summary: "AWS SES Simple Notification Service Destination",
        security: [],
        description: "Auto-confirms SNS subs then continuously streams background-throttled 'Bounce', 'Complaint', and 'Delivery' telemetry updates into permanent tables.",
        responses: { 200: { description: "Ack yielded" } }
      }
    }
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer"
      }
    },
    schemas: {
      Campaign: { type: "object" },
      Contact: { type: "object" },
      ContactList: { type: "object" },
      Template: { type: "object" },
      SuppressionItem: { type: "object" },
      SuccessResponse: { type: "object", properties: { success: { type: "boolean" } } }
    },
    responses: {
      ServerError: {
        description: "System execution failure",
        content: { "application/json": { schema: { type: "object", properties: { error: { type: "string" } } } } }
      }
    }
  }
};

// Clean up nested components duplicates
openApiSpec.components.schemas = {
  Campaign: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      subject: { type: "string" },
      previewText: { type: "string" },
      fromName: { type: "string" },
      fromEmail: { type: "string" },
      status: { type: "string" },
      templateId: { type: "string" }
    }
  },
  Contact: {
    type: "object",
    properties: {
      id: { type: "string" },
      email: { type: "string" },
      firstName: { type: "string" },
      lastName: { type: "string" },
      status: { type: "string" }
    }
  },
  ContactList: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      description: { type: "string" }
    }
  },
  Template: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      category: { type: "string" },
      content: { type: "string" },
      html: { type: "string" }
    }
  },
  SuppressionItem: {
    type: "object",
    properties: {
      id: { type: "string" },
      email: { type: "string" },
      reason: { type: "string" },
      date: { type: "string" }
    }
  },
  SuccessResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true }
    }
  }
};

fs.writeFileSync(path.join(outputDir, 'openapi.json'), JSON.stringify(openApiSpec, null, 2));

// ==============================================
// 🚀 Postman Collection Definition
// ==============================================

const postmanCollection = {
  info: {
    name: "PulseSend Email Campaign Platform API",
    description: "Official High-Fidelity Postman Collection for interacting with PulseSend endpoints.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  item: [],
  auth: {
    type: "bearer",
    bearer: [
      {
        key: "token",
        value: "{{auth_token}}",
        type: "string"
      }
    ]
  },
  variable: [
    {
      key: "base_url",
      value: "http://localhost:3000",
      type: "string"
    },
    {
      key: "auth_token",
      value: "PASTE_YOUR_CLERK_TOKEN_HERE",
      type: "string"
    }
  ]
};

// Helper to group items into folders
const folders = {};

function addRequestToCollection(tag, name, method, endpoint, body = null, queryParams = []) {
  if (!folders[tag]) {
    folders[tag] = {
      name: tag,
      item: []
    };
  }

  const query = queryParams.map(q => ({
    key: q.name,
    value: q.value || "",
    description: q.desc || "",
    disabled: !q.required
  }));

  const pmItem = {
    name: name,
    request: {
      method: method.toUpperCase(),
      header: [],
      url: {
        raw: `{{base_url}}${endpoint}`,
        host: ["{{base_url}}"],
        path: endpoint.split('/').filter(Boolean),
        query: query
      }
    },
    response: []
  };

  if (body) {
    pmItem.request.body = {
      mode: "raw",
      raw: JSON.stringify(body, null, 2),
      options: {
        raw: {
          language: "json"
        }
      }
    };
  }

  // Skip authentication for public endpoints
  const publicTags = ["Compliance Pipelines", "Telemetry Tracking Hooks", "Webhooks Gateway"];
  if (publicTags.includes(tag) || endpoint.includes('/auth/login') || endpoint.includes('/auth/signup')) {
    pmItem.request.auth = {
      type: "noauth"
    };
  }

  folders[tag].item.push(pmItem);
}

// Add Admin
addRequestToCollection("Admin", "Reset Database", "POST", "/api/admin/reset-db");

// Add Auth
addRequestToCollection("Auth", "Login User", "POST", "/api/auth/login", { email: "admin@pulsesend.com", password: "securepassword123" });
addRequestToCollection("Auth", "Sign Up User", "POST", "/api/auth/signup", { email: "neworg@company.com", password: "anotherpassword", orgName: "Enterprise Acme" });
addRequestToCollection("Auth", "Get Auth Profile (Me)", "GET", "/api/auth/me");

// Add Campaigns
addRequestToCollection("Campaigns", "List All Campaigns", "GET", "/api/campaigns");
addRequestToCollection("Campaigns", "Create Campaign Draft", "POST", "/api/campaigns", {
  name: "Spring Fashion Collection",
  subject: "Explore 2026 Trends!",
  fromName: "Vogue Store",
  fromEmail: "trends@vogue.com",
  status: "draft",
  templateId: "existing-template-uuid-here"
});
addRequestToCollection("Campaigns", "Update Existing Campaign", "PUT", "/api/campaigns", {
  name: "Spring Fashion (Updated)",
  subject: "Explore 2026 Trends! Now Live",
  status: "sent"
}, [{ name: "id", value: "campaign-uuid", required: true }]);
addRequestToCollection("Campaigns", "Delete Campaign", "DELETE", "/api/campaigns", null, [{ name: "id", value: "campaign-uuid", required: true }]);
addRequestToCollection("Campaigns", "Fire Debug Direct Test", "POST", "/api/send-test", {
  to: "test-recipient@domain.com",
  subject: "PulseSend Realtime AWS SMTP Diagnostics",
  html: "<h1>System operational</h1>"
});

// Add Analytics
addRequestToCollection("Analytics", "Get Campaign Report Payload", "GET", "/api/campaigns/:id/report"); // Note path param in Postman can be set manually or parsed
folders["Analytics"].item[0].request.url.raw = "{{base_url}}/api/campaigns/YOUR_CAMPAIGN_ID/report";
folders["Analytics"].item[0].request.url.path = ["api", "campaigns", "YOUR_CAMPAIGN_ID", "report"];

addRequestToCollection("Analytics", "Retrieve Historical Data Arrays", "GET", "/api/analytics", null, [{ name: "id", desc: "Campaign ID override", required: false }]);
addRequestToCollection("Analytics", "Dashboard Multi-Telemetry Data", "GET", "/api/dashboard");

// Add Contacts
addRequestToCollection("Contacts", "List Multi-Tenant Contacts", "GET", "/api/contacts");
addRequestToCollection("Contacts", "Create Individual Subscriber", "POST", "/api/contacts", {
  email: "jane.smith@corp.net",
  firstName: "Jane",
  lastName: "Smith",
  company: "Corporate Net",
  city: "San Francisco",
  jobTitle: "VP Engineering",
  status: "active"
});
addRequestToCollection("Contacts", "Batch Import Array (CSV Simulation)", "POST", "/api/contacts/import", {
  contacts: [
    { email: "alice@domain.com", firstName: "Alice", company: "Inc" },
    { email: "bob@domain.com", firstName: "Bob", status: "unsubscribed" }
  ],
  listId: "list-uuid-here"
});
addRequestToCollection("Contacts", "Get Contact Interactive Timeline", "GET", "/api/contacts/timeline", null, [{ name: "contactId", value: "contact-uuid-here", required: true }]);

// Add Lists
addRequestToCollection("Lists", "List All Lists", "GET", "/api/lists");
addRequestToCollection("Lists", "Create Empty Contact List", "POST", "/api/lists", { name: "Fresh Leads - Q2", description: "Lead pipeline generated during Apr-Jun" });
addRequestToCollection("Lists", "Modify List Labels", "PUT", "/api/lists", { name: "Q2 Pipe Renamed", description: "Active leads" }, [{ name: "id", value: "list-uuid", required: true }]);
addRequestToCollection("Lists", "Delete Contact List", "DELETE", "/api/lists", null, [{ name: "id", value: "list-uuid", required: true }]);
addRequestToCollection("Lists", "Add Contacts to List (Standard)", "POST", "/api/lists/members", { listId: "list-uuid", contactIds: ["uuid1", "uuid2"] });
addRequestToCollection("Lists", "Bulk List Action Toggle (Adv)", "POST", "/api/lists/members/bulk", { action: "remove", listId: "list-uuid", contactIds: ["uuid1", "uuid2"] });

// Add Organization
addRequestToCollection("Organization", "Get Settings Metadata", "GET", "/api/org");
addRequestToCollection("Organization", "Update AWS SES Configurations", "POST", "/api/org", {
  name: "Acme Consolidated",
  fromEmail: "noreply@acme.co",
  region: "us-east-1",
  configSet: "primary-ses-set"
});

// Add Segments
addRequestToCollection("Segments", "List Dynamic Rule Segments", "GET", "/api/segments");
addRequestToCollection("Segments", "Save Rules Definition", "POST", "/api/segments", { name: "Engaged Tech Leads", rules: { condition: "OR", criteria: ["clicks > 5"] } });

// Add Suppression
addRequestToCollection("Suppression & Security", "List Quarantined Vault", "GET", "/api/suppression");
addRequestToCollection("Suppression & Security", "Blacklist Target Manually", "POST", "/api/suppression", { email: "spammy@competitor.com", reason: "manual", log: "Intercepted via support queue" });
addRequestToCollection("Suppression & Security", "Remove Quarantine Suppression", "DELETE", "/api/suppression", null, [{ name: "id", value: "record-uuid", required: true }]);

// Add Templates
addRequestToCollection("Templates", "Retrieve Render Library Assets", "GET", "/api/templates");
addRequestToCollection("Templates", "Save Layout Blocks & HTML", "POST", "/api/templates", {
  name: "Newsletter Default v2",
  category: "Updates",
  content: "[{}]",
  html: "<html><body><h1>Weekly Updates</h1></body></html>"
});
addRequestToCollection("Templates", "Delete Template Layout", "DELETE", "/api/templates", null, [{ name: "id", value: "template-uuid", required: true }]);

// Add Media
addRequestToCollection("Media & Files", "Upload Base64 to AWS S3", "POST", "/api/upload", { file: "data:image/png;base64,iVBORw0KGgoAAA...", fileName: "header-logo.png", fileType: "image/png" });

// Add Compliance
addRequestToCollection("Compliance Pipelines", "Fetch Recipient Grid Preferences", "GET", "/api/preferences", null, [{ name: "uid", value: "contact_campaign", required: true }]);
addRequestToCollection("Compliance Pipelines", "Save Subscription Preferences", "POST", "/api/preferences", { uid: "contact_campaign", listIds: ["list-uuid-1", "list-uuid-2"] });
addRequestToCollection("Compliance Pipelines", "Perform Compliance Opt-Out", "POST", "/api/unsubscribe", { uid: "contact_campaign" });
addRequestToCollection("Compliance Pipelines", "Rollback Opt-Out Elgibility", "PUT", "/api/unsubscribe", { uid: "contact_campaign" });

// Add Telemetry
addRequestToCollection("Telemetry Tracking Hooks", "Simulate Email Click Redirect", "GET", "/track/click", null, [{ name: "uid", value: "contact_campaign", required: true }, { name: "url", value: "https://google.com", required: true }]);
addRequestToCollection("Telemetry Tracking Hooks", "Simulate Email Open Image Load", "GET", "/track/open", null, [{ name: "uid", value: "contact_campaign", required: true }]);

// Add System Automation
addRequestToCollection("System Automation", "Process Scheduled Delivery Queues", "GET", "/api/cron/process-schedule");

// Add Webhooks
addRequestToCollection("Webhooks Gateway", "Ingest Clerk Lifecycle Webhook", "POST", "/api/webhooks/clerk", { type: "user.created", data: { id: "user_xyz", email_addresses: [{ email_address: "clerkuser@domain.com" }] } });
addRequestToCollection("Webhooks Gateway", "Ingest AWS SNS Notifications", "POST", "/api/webhooks/ses", { Type: "Notification", Message: "{\"notificationType\":\"Bounce\",\"mail\":{\"destination\":[\"bounced@recipient.com\"]}}" });

// Add Users
addRequestToCollection("Users & Access Control", "List Occupant manifestation", "GET", "/api/users");
addRequestToCollection("Users & Access Control", "Invite Seat Candidate", "POST", "/api/users", { email: "manager@client.com", role: "CAMPAIGN_MANAGER" });
addRequestToCollection("Users & Access Control", "Patch RBAC Member Role", "PUT", "/api/users", { id: "user-uuid", role: "SUPER_ADMIN" });
addRequestToCollection("Users & Access Control", "Evict Active Member Seat", "DELETE", "/api/users", null, [{ name: "id", value: "user-uuid", required: true }]);

// Assemble Postman structure sorted by folders
Object.keys(folders).sort().forEach(tagName => {
  postmanCollection.item.push(folders[tagName]);
});

fs.writeFileSync(path.join(outputDir, 'postman_collection.json'), JSON.stringify(postmanCollection, null, 2));

console.log("🚀 PulseSend API Documentation Generation Successful!");
console.log(`📁 Spec written safely to: ${outputDir}`);
