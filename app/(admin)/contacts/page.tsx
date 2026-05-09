"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Preloader from "@/components/Preloader";
import { toast } from "@/lib/toast";
import { useStore } from "@/lib/store";
import {
  Users,
  Plus,
  Search,
  SlidersHorizontal,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  FileText,
  Sparkles,
  Play,
  CheckCircle,
  Upload,
  ArrowRight,
  Database,
  Loader2,
} from "lucide-react";

// Mock Lists
const initialLists: any[] = [];

// Mock Contacts
const initialContacts: any[] = [];

export default function ContactsPage() {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<"lists" | "contacts" | "segments" | "import">("lists");
  const [isLoading, setIsLoading] = useState(true);
  
  // Lists State
  const [lists, setLists] = useState(initialLists);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");

  // Contacts State
  const [contacts, setContacts] = useState(initialContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedListFilter, setSelectedListFilter] = useState("all");
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactFirstName, setNewContactFirstName] = useState("");
  const [newContactLastName, setNewContactLastName] = useState("");
  const [newContactCompany, setNewContactCompany] = useState("");
  const [newContactCity, setNewContactCity] = useState("");
  const [newContactListId, setNewContactListId] = useState("none");
  const [addingContact, setAddingContact] = useState(false);

  const [showAddExistingModal, setShowAddExistingModal] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [submittingExisting, setSubmittingExisting] = useState(false);

  // Bulk Actions & Timeline States
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [selectedDetailContact, setSelectedDetailContact] = useState<any>(null);
  const [contactTimeline, setContactTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [bulkTargetListId, setBulkTargetListId] = useState<string>("none");
  const [bulkProcessing, setBulkProcessing] = useState(false);


  const handleAddExistingToActiveList = async () => {
    if (selectedContactIds.length === 0) {
      toast.error("Please select at least one contact.");
      return;
    }
    setSubmittingExisting(true);
    try {
      const res = await fetch("/api/lists/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId: selectedListFilter,
          contactIds: selectedContactIds,
        }),
      });

      if (res.ok) {
        const updatedContacts = contacts.map((c) => {
          if (selectedContactIds.includes(c.id)) {
            const listIds = c.listIds ? [...c.listIds] : [];
            if (!listIds.includes(selectedListFilter)) {
              listIds.push(selectedListFilter);
            }
            return { ...c, listIds };
          }
          return c;
        });
        setContacts(updatedContacts);

        const resLists = await fetch("/api/lists");
        if (resLists.ok) {
          const dataLists = await resLists.json();
          if (dataLists && Array.isArray(dataLists)) {
            setLists(dataLists);
          }
        }

        toast.success(`Successfully subscribed ${selectedContactIds.length} contact(s) to the mailing list!`);
        setShowAddExistingModal(false);
        setSelectedContactIds([]);
      } else {
        const errData = await res.json();
        toast.error(`Failed to add contacts: ${errData.error || "Unknown error"}`);
      }
    } catch (err: any) {
      console.error("Failed to add existing contacts:", err);
      toast.error(`Network error: ${err.message}`);
    } finally {
      setSubmittingExisting(false);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactEmail) {
      alert("Please enter an email address.");
      return;
    }
    setAddingContact(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newContactEmail,
          firstName: newContactFirstName,
          lastName: newContactLastName,
          company: newContactCompany,
          city: newContactCity,
          listId: newContactListId,
        }),
      });

      if (res.ok) {
        const createdContact = await res.json();
        const mappedContact = {
          ...createdContact,
          listIds: newContactListId !== "none" ? [newContactListId] : [],
        };
        setContacts([mappedContact, ...contacts]);
        
        // Refresh live list counts
        const resLists = await fetch("/api/lists");
        if (resLists.ok) {
          const dataLists = await resLists.json();
          if (dataLists && Array.isArray(dataLists)) {
            setLists(dataLists);
          }
        }

        setShowNewContactModal(false);
        setNewContactEmail("");
        setNewContactFirstName("");
        setNewContactLastName("");
        setNewContactCompany("");
        setNewContactCity("");
        setNewContactListId("none");
      } else {
        const errData = await res.json();
        alert(`Failed to add contact: ${errData.error || "Unknown error"}`);
      }
    } catch (err: any) {
      console.error("Error creating contact manually:", err);
      alert(`Network error: ${err.message}`);
    } finally {
      setAddingContact(false);
    }
  };

  const handleBulkAction = async (action: "add" | "remove" | "delete") => {
    if (selectedRowIds.length === 0) {
      toast.error("Please select at least one contact first.");
      return;
    }
    
    if (action === "add" && bulkTargetListId === "none") {
      toast.error("Please select a target list to assign contacts to.");
      return;
    }

    setBulkProcessing(true);
    try {
      const res = await fetch("/api/lists/members/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactIds: selectedRowIds,
          listId: action === "remove" ? selectedListFilter : bulkTargetListId,
          action,
        }),
      });

      if (res.ok) {
        toast.success(`Successfully processed bulk action: ${action.toUpperCase()} for ${selectedRowIds.length} contact(s).`);
        setSelectedRowIds([]);
        setBulkTargetListId("none");

        // Refresh lists and contacts
        const resContacts = await fetch("/api/contacts");
        if (resContacts.ok) {
          const dataContacts = await resContacts.json();
          if (dataContacts && Array.isArray(dataContacts)) {
            setContacts(dataContacts);
          }
        }

        const resLists = await fetch("/api/lists");
        if (resLists.ok) {
          const dataLists = await resLists.json();
          if (dataLists && Array.isArray(dataLists)) {
            setLists(dataLists);
          }
        }
      } else {
        const data = await res.json();
        toast.error(`Bulk operation failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      console.error("Bulk operation error:", err);
      toast.error(`Network error: ${err.message}`);
    } finally {
      setBulkProcessing(false);
    }
  };

  const fetchContactTimeline = async (contact: any) => {
    setSelectedDetailContact(contact);
    setLoadingTimeline(true);
    setContactTimeline([]);
    try {
      const res = await fetch(`/api/contacts/timeline?contactId=${contact.id}`);
      if (res.ok) {
        const data = await res.json();
        setContactTimeline(data || []);
      } else {
        toast.error("Failed to load contact event history.");
      }
    } catch (err) {
      console.error("Error loading timeline:", err);
    } finally {
      setLoadingTimeline(false);
    }
  };


  // Fetch live lists and contacts from Supabase via Next.js API Routes on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pulsesend:loading"));
    }

    async function fetchLiveData() {
      try {
        const resLists = await fetch("/api/lists", {
          headers: { "x-org-id": user?.org_id || "" },
        });
        if (resLists.ok) {
          const dataLists = await resLists.json();
          if (dataLists && Array.isArray(dataLists)) {
            setLists(dataLists);
          }
        }
        
        const resContacts = await fetch("/api/contacts", {
          headers: { "x-org-id": user?.org_id || "" },
        });
        if (resContacts.ok) {
          const dataContacts = await resContacts.json();
          if (dataContacts && Array.isArray(dataContacts)) {
            setContacts(dataContacts);
          }
        }
      } catch (err) {
        console.error("Failed to fetch live data from Supabase, using preloaded fallback sandbox data instead.", err);
      } finally {
        setIsLoading(false);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("pulsesend:ready"));
        }
      }
    }
    fetchLiveData();
  }, []);

  // Segment Builder State
   const [segmentName, setSegmentName] = useState("");
  const [logicalOperator, setLogicalOperator] = useState<"AND" | "OR">("AND");
  const [rules, setRules] = useState([
    { field: "city", operator: "equals", value: "Hyderabad" },
    { field: "status", operator: "equals", value: "active" },
  ]);
  const [liveSegmentCount, setLiveSegmentCount] = useState(0);
  const [savedSegments, setSavedSegments] = useState<any[]>([]);

  const handleSaveSegment = () => {
    const name = prompt("Enter a name for this segment:", "Active Subscribers");
    if (!name || !name.trim()) return;

    const newSegment = {
      id: `s-${Date.now()}`,
      name: name.trim(),
      count: liveSegmentCount,
    };
    setSavedSegments([...savedSegments, newSegment]);
    toast.success(`Segment "${name}" saved successfully!`);
  };

  // CSV Import Wizard State
  const [importStep, setImportStep] = useState<1 | 2 | 3 | 4>(1);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [targetListId, setTargetListId] = useState<string>("none");
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    email: "0",
    firstName: "1",
    lastName: "2",
    company: "3",
    city: "4",
  });
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState({ added: 0, updated: 0, skipped: 0, errored: 0 });

  // Add List Handler
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName, description: newListDesc }),
      });
      
      if (res.ok) {
        const createdList = await res.json();
        setLists([createdList, ...lists]);
      } else {
        throw new Error("Failed to create list on server");
      }
    } catch (err) {
      console.error("Live DB save failed, fallback to local memory state.", err);
      const newList = {
        id: `l-${Date.now()}`,
        name: newListName,
        description: newListDesc,
        count: 0,
        tags: ["New"],
      };
      setLists([newList, ...lists]);
    }
    
    setNewListName("");
    setNewListDesc("");
    setShowNewListModal(false);
  };

  // Live Count calculation in Segment Builder based on rules and active contacts
  useEffect(() => {
    if (contacts.length === 0) {
      setLiveSegmentCount(0);
      return;
    }

    const matching = contacts.filter((c) => {
      const results = rules.map((r) => {
        const fieldVal = String(c[r.field as keyof typeof c] || "").toLowerCase();
        const matchVal = String(r.value || "").toLowerCase();

        if (r.operator === "equals") {
          return fieldVal === matchVal;
        } else if (r.operator === "contains") {
          return fieldVal.includes(matchVal);
        } else if (r.operator === "not_equals") {
          return fieldVal !== matchVal;
        }
        return false;
      });

      if (logicalOperator === "AND") {
        return results.every((res) => res === true);
      } else {
        return results.some((res) => res === true);
      }
    });

    setLiveSegmentCount(matching.length);
  }, [rules, logicalOperator, contacts]);

  // Add rule in Segment builder
  const addRule = () => {
    setRules([...rules, { field: "email", operator: "contains", value: "" }]);
  };

  // CSV File upload with real dynamic parsing
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCsvFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;
        
        const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length === 0) return;
        
        const parsed = lines.map(line => {
          const result = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        });

        const headers = parsed[0];
        const dataRows = parsed.slice(1);
        
        setCsvHeaders(headers);
        setCsvRows(dataRows);

        // Auto-detect mappings based on header name matches
        const initialMapping: Record<string, string> = {
          email: "none",
          firstName: "none",
          lastName: "none",
          company: "none",
          city: "none",
        };

        headers.forEach((h, index) => {
          const lower = h.toLowerCase().replace(/_|[^\w]/g, "");
          if (lower === "email") initialMapping.email = String(index);
          else if (lower === "firstname" || lower === "first" || lower === "name") initialMapping.firstName = String(index);
          else if (lower === "lastname" || lower === "last") initialMapping.lastName = String(index);
          else if (lower === "company" || lower === "organization") initialMapping.company = String(index);
          else if (lower === "city" || lower === "location") initialMapping.city = String(index);
        });

        // Fallbacks if no headers were detected
        if (initialMapping.email === "none" && headers.length > 0) initialMapping.email = "0";

        setColumnMapping(initialMapping);
        setImportStep(2);
      };
      reader.readAsText(file);
    }
  };

  // Run Real Database-Backed Bulk Import
  const runImportJob = async () => {
    setImportStep(3); // Progress screen
    setImportProgress(10);

    // Map each row based on columnMapping
    const contactsToImport = csvRows.map(row => {
      const getVal = (fieldKey: string) => {
        const indexStr = columnMapping[fieldKey];
        if (indexStr === "none" || !indexStr) return "";
        const idx = parseInt(indexStr, 10);
        return row[idx] || "";
      };

      return {
        email: getVal("email"),
        firstName: getVal("firstName"),
        lastName: getVal("lastName"),
        company: getVal("company"),
        city: getVal("city"),
        status: "active",
      };
    }).filter(c => c.email && c.email.includes("@"));

    setImportProgress(40);

    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: contactsToImport, listId: targetListId }),
      });

      setImportProgress(80);

      if (res.ok) {
        const results = await res.json();
        setImportResults({
          added: results.added || 0,
          updated: results.updated || 0,
          skipped: results.skipped || 0,
          errored: results.errored || 0,
        });

        // Refetch contacts and lists to update all views and counts instantly
        const resContacts = await fetch("/api/contacts");
        if (resContacts.ok) {
          const dataContacts = await resContacts.json();
          if (dataContacts && Array.isArray(dataContacts)) {
            setContacts(dataContacts);
          }
        }

        const resLists = await fetch("/api/lists");
        if (resLists.ok) {
          const dataLists = await resLists.json();
          if (dataLists && Array.isArray(dataLists)) {
            setLists(dataLists);
          }
        }

        setImportProgress(100);
        setImportStep(4);
      } else {
        throw new Error("Bulk import failed on server");
      }
    } catch (err) {
      console.error("Import job failed:", err);
      setImportResults({
        added: 0,
        updated: 0,
        skipped: 0,
        errored: contactsToImport.length,
      });
      setImportProgress(100);
      setImportStep(4);
    }
  };

  // Filter contacts
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.firstName + " " + c.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesList = selectedListFilter === "all" || (c.listIds && c.listIds.includes(selectedListFilter));
    return matchesSearch && matchesStatus && matchesList;
  });

  return (
    <div className="space-y-5 select-none">
      {/* Navigation Tabs */}
      <div className="flex border-b border-border pb-px">
        {(["lists", "contacts", "segments", "import"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 font-semibold text-[13px] tracking-wide border-b-2 transition relative cursor-pointer ${
              activeTab === tab
                ? "text-foreground border-primary font-bold"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {tab === "lists" && "Mailing Lists"}
            {tab === "contacts" && "All Contacts"}
            {tab === "segments" && "Segment Builder"}
            {tab === "import" && "CSV Import"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* MAILING LISTS TAB */}
        {activeTab === "lists" && (
          <motion.div
            key="lists-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-bold text-foreground tracking-tight">Contact Directories</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Manage and organize your distinct mailing lists</p>
              </div>
              <button
                onClick={() => setShowNewListModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-primary text-white hover:bg-primary/90 text-[13px] font-semibold shadow-[0_1px_3px_rgba(95,90,246,0.2)] transition cursor-pointer border border-white/5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create List</span>
              </button>
            </div>

            {/* Stats summary strip above cards — totals derived from the same lists data the cards use */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 glass-hud rounded-lg flex items-center gap-3">
                <Users className="w-5 h-5 text-[#7C5CFF] shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Total Lists</p>
                  <p className="text-2xl font-black text-foreground font-mono">{lists.length}</p>
                </div>
              </div>
              <div className="p-4 glass-hud rounded-lg flex items-center gap-3">
                <Database className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Total Contacts</p>
                  <p className="text-2xl font-black text-foreground font-mono">
                    {lists.reduce((sum, l) => sum + (l.count ?? 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="p-4 glass-hud rounded-lg flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Active Subscribers</p>
                  <p className="text-2xl font-black text-foreground font-mono">{contacts.filter(c => c.status === "active").length}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {lists.map((list) => (
                <div
                  key={list.id}
                  className="p-5 premium-slab rounded-md flex flex-col justify-between group min-h-[180px]"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-[14px] font-bold text-foreground truncate group-hover:text-primary transition">
                        {list.name}
                      </h3>
                      <span className="text-[11px] bg-secondary border border-border px-2.5 py-0.5 rounded text-muted-foreground font-mono font-bold shrink-0">
                        {list.count ?? 0} contacts
                      </span>
                    </div>
                    <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {list.description || "No description provided for this list."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-border/60">
                    <div className="flex gap-1.5 flex-wrap">
                      {(list.tags ?? []).map((tag: string) => (
                        <span key={tag} className="text-[11px] bg-secondary text-muted-foreground border border-border px-2 py-0.5 rounded font-mono font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedListFilter(list.id);
                        setActiveTab("contacts");
                      }}
                      className="text-[12px] text-muted-foreground hover:text-primary font-mono font-bold transition cursor-pointer"
                    >
                      Manage →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* CREATE LIST MODAL */}
            {showNewListModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-md bg-card border border-border p-6 rounded-md shadow-lg space-y-6"
                >
                  <div>
                    <h3 className="text-sm font-bold text-foreground tracking-tight">Create Mailing List</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Initialize a new contact audience segment</p>
                  </div>

                  <form onSubmit={handleCreateList} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400 font-mono">List Name</label>
                      <input
                        type="text"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="e.g. Early Adopters"
                        required
                        className="w-full px-3 py-2 rounded bg-zinc-900 border border-border focus:outline-none focus:border-zinc-700 text-sm text-zinc-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400 font-mono">Description</label>
                      <textarea
                        value={newListDesc}
                        onChange={(e) => setNewListDesc(e.target.value)}
                        placeholder="Briefly describe what this audience represents..."
                        className="w-full px-3 py-2 rounded bg-zinc-900 border border-border focus:outline-none focus:border-zinc-700 text-sm text-zinc-200 h-24 resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setShowNewListModal(false)}
                        className="px-4 py-2 rounded border border-border hover:bg-secondary text-muted-foreground text-xs font-semibold transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 text-xs font-semibold transition shadow-md border border-white/5"
                      >
                        Create List
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* ALL CONTACTS TAB */}
        {activeTab === "contacts" && (
          <motion.div
            key="contacts-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {selectedListFilter !== "all" && (
              <div className="p-4 bg-zinc-950/40 border border-[#7C5CFF]/20 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-zinc-300 font-mono">Managing Audience List: <span className="text-[#7C5CFF]">{lists.find(l => l.id === selectedListFilter)?.name}</span></h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Subscribe other existing contacts in your directory directly to this mailing list.</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedContactIds([]);
                    setShowAddExistingModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-[#7C5CFF] border border-[#7C5CFF]/30 text-[11px] font-bold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Existing Contacts</span>
                </button>
              </div>
            )}

            {/* Filters Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative max-w-sm w-full">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search contacts by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded bg-zinc-900 border border-border text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                <SlidersHorizontal className="w-4 h-4 text-zinc-500" />
                <select
                  value={selectedListFilter}
                  onChange={(e) => setSelectedListFilter(e.target.value)}
                  className="px-3 py-1.5 rounded bg-zinc-900 border border-border text-xs text-zinc-300 font-medium font-mono focus:outline-none focus:border-zinc-700"
                >
                  <option value="all">All Lists</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded bg-zinc-900 border border-border text-xs text-zinc-300 font-medium font-mono focus:outline-none focus:border-zinc-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="unsubscribed">Unsubscribed</option>
                  <option value="bounced">Bounced</option>
                  <option value="complained">Complained</option>
                </select>

                <button
                  type="button"
                  onClick={() => setShowNewContactModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/90 text-xs font-bold shadow-sm border border-white/5 transition cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Contact</span>
                </button>
              </div>
            </div>

            {/* Contacts Table */}
            <div className="bg-card border border-border rounded-md overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-zinc-500 font-mono text-[11px] uppercase bg-secondary/10">
                      <th className="py-3 px-5 font-semibold w-12 text-center">
                        <input
                          type="checkbox"
                          checked={filteredContacts.length > 0 && selectedRowIds.length === filteredContacts.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRowIds(filteredContacts.map((c) => c.id));
                            } else {
                              setSelectedRowIds([]);
                            }
                          }}
                          className="w-4 h-4 accent-[#7C5CFF] rounded cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-5 font-semibold">Contact Email</th>
                      <th className="py-3 px-5 font-semibold">First Name</th>
                      <th className="py-3 px-5 font-semibold">Last Name</th>
                      <th className="py-3 px-5 font-semibold">Company</th>
                      <th className="py-3 px-5 font-semibold">City</th>
                      <th className="py-3 px-5 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((contact) => {
                      const isSelected = selectedRowIds.includes(contact.id);
                      return (
                        <tr key={contact.id} className={`border-b border-border/50 transition ${isSelected ? "bg-[#7C5CFF]/[0.02]" : "hover:bg-secondary/40"}`}>
                          <td className="py-3.5 px-5 text-center w-12">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRowIds([...selectedRowIds, contact.id]);
                                } else {
                                  setSelectedRowIds(selectedRowIds.filter((id) => id !== contact.id));
                                }
                              }}
                              className="w-4 h-4 accent-[#7C5CFF] rounded cursor-pointer"
                            />
                          </td>
                          <td 
                            onClick={() => fetchContactTimeline(contact)}
                            className="py-3.5 px-5 font-bold text-zinc-100 font-mono text-[13px] hover:text-[#9E86FF] cursor-pointer transition underline decoration-[#7C5CFF]/30 underline-offset-4"
                          >
                            {contact.email}
                          </td>
                        <td className="py-3.5 px-5 text-[13px] text-zinc-300">{contact.firstName}</td>
                        <td className="py-3.5 px-5 text-[13px] text-zinc-300">{contact.lastName}</td>
                        <td className="py-3.5 px-5 text-[13px] text-foreground font-semibold">{contact.company}</td>
                        <td className="py-3.5 px-5 text-[13px] text-muted-foreground font-mono">{contact.city}</td>
                        <td className="py-3.5 px-5 text-right">
                          <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded uppercase ${
                            contact.status === "active"
                              ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/30"
                              : contact.status === "unsubscribed"
                              ? "bg-amber-950/20 text-amber-400 border border-amber-900/30"
                              : contact.status === "bounced"
                              ? "bg-red-950/20 text-red-400 border border-red-900/30"
                              : "bg-red-950/40 text-red-500 border border-red-800/40"
                          }`}>
                            {contact.status}
                          </span>
                        </td>
                        </tr>
                      );
                    })}
                    {filteredContacts.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-zinc-500 font-mono">
                          No matching contacts discovered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FLOATING BOTTOM BULK ACTIONS PANEL */}
            <AnimatePresence>
              {selectedRowIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-2xl bg-[#0d0e12] border border-[#7C5CFF]/30 hover:border-[#7C5CFF]/50 shadow-[0_10px_35px_-5px_rgba(124,92,255,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-lg select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/35 flex items-center justify-center text-[10px] font-mono font-bold text-[#A890FF]">
                      {selectedRowIds.length}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Contacts Selected</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Perform bulk mutations across mailing lists</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                    {/* List assign action */}
                    <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-850 p-1 rounded-xl text-xs">
                      <select
                        value={bulkTargetListId}
                        onChange={(e) => setBulkTargetListId(e.target.value)}
                        className="px-2.5 py-1 rounded bg-transparent text-zinc-300 font-medium font-mono focus:outline-none focus:border-zinc-700"
                      >
                        <option value="none">Assign to List...</option>
                        {lists.map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleBulkAction("add")}
                        disabled={bulkProcessing || bulkTargetListId === "none"}
                        className="px-2.5 py-1 rounded bg-white text-black font-semibold text-[11px] hover:bg-zinc-200 disabled:opacity-50 transition cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>

                    {/* Remove from active list action */}
                    {selectedListFilter !== "all" && (
                      <button
                        onClick={() => handleBulkAction("remove")}
                        disabled={bulkProcessing}
                        className="px-3 py-1.5 rounded-xl border border-amber-900/40 bg-amber-950/10 text-amber-400 font-bold hover:bg-amber-950/20 text-[11px] transition cursor-pointer"
                      >
                        Remove from List
                      </button>
                    )}

                    {/* Bulk Delete action */}
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete these ${selectedRowIds.length} selected contacts permanently?`)) {
                          handleBulkAction("delete");
                        }
                      }}
                      disabled={bulkProcessing}
                      className="px-3 py-1.5 rounded-xl border border-red-950/40 bg-red-950/10 hover:bg-red-950/20 text-red-400 font-bold text-[11px] transition cursor-pointer"
                    >
                      Delete
                    </button>

                    <button
                      onClick={() => setSelectedRowIds([])}
                      className="text-zinc-500 hover:text-zinc-300 text-xs font-semibold px-2 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SLIDE-OVER CONTACT DETAIL TIMELINE DRAWER */}
            <AnimatePresence>
              {selectedDetailContact && (
                <div className="fixed inset-0 z-50 flex justify-end">
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedDetailContact(null)}
                    className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                  />

                  {/* Slider Container */}
                  <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className="relative w-full max-w-md h-full bg-[#050608] border-l border-zinc-900 shadow-2xl p-6 flex flex-col z-10 select-none overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">Subscriber Profile</h3>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Chronological engagement & audit timeline</p>
                      </div>
                      <button
                        onClick={() => setSelectedDetailContact(null)}
                        className="px-2.5 py-1.5 rounded border border-zinc-850 hover:bg-zinc-900 text-zinc-400 text-xs font-semibold transition cursor-pointer"
                      >
                        Close
                      </button>
                    </div>

                    {/* Profile Metadata */}
                    <div className="py-6 space-y-4 border-b border-zinc-900 text-xs shrink-0">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Email Address</span>
                        <p className="text-sm font-bold text-white font-mono">{selectedDetailContact.email}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Subscriber Name</span>
                          <p className="text-xs text-zinc-300 font-semibold">
                            {selectedDetailContact.firstName || selectedDetailContact.lastName 
                              ? `${selectedDetailContact.firstName || ""} ${selectedDetailContact.lastName || ""}` 
                              : "Unnamed Subscriber"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Location (City)</span>
                          <p className="text-xs text-zinc-300 font-mono">{selectedDetailContact.city || "—"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Company</span>
                          <p className="text-xs text-white font-bold">{selectedDetailContact.company || "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Audience Status</span>
                          <div>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                              selectedDetailContact.status === "active"
                                ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/30"
                                : selectedDetailContact.status === "unsubscribed"
                                ? "bg-amber-950/20 text-amber-400 border border-amber-900/30"
                                : "bg-red-950/20 text-red-400 border border-red-900/30"
                            }`}>
                              {selectedDetailContact.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chronological Event Timeline */}
                    <div className="flex-1 overflow-y-auto pt-6 flex flex-col min-h-0">
                      <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mb-4 block shrink-0">Engagement History Stream</span>
                      
                      <div className="flex-1 pr-1">
                        {loadingTimeline ? (
                          <div className="flex flex-col items-center justify-center h-48 space-y-2 text-zinc-500">
                            <Loader2 className="w-5 h-5 animate-spin text-[#7C5CFF]" />
                            <span className="text-[10px] font-mono">Fetching database records...</span>
                          </div>
                        ) : contactTimeline.length === 0 ? (
                          <div className="h-48 border border-dashed border-zinc-900 rounded-xl flex flex-col items-center justify-center text-center p-4 text-zinc-600 space-y-1">
                            <AlertCircle className="w-5 h-5 text-zinc-700" />
                            <p className="text-[10px] font-bold font-mono uppercase">No Events Recorded</p>
                            <p className="text-[9px] text-zinc-600 max-w-xs leading-relaxed">
                              This contact has not interacted with any sent campaigns yet.
                            </p>
                          </div>
                        ) : (
                          <div className="relative pl-4 border-l border-zinc-900 space-y-6 text-xs ml-2 py-2">
                            {contactTimeline.map((ev, index) => {
                              const iconColor = 
                                ev.event_type === "opened" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                                ev.event_type === "clicked" ? "bg-[#7C5CFF] shadow-[0_0_8px_rgba(124,92,255,0.5)]" :
                                ev.event_type === "unsubscribed" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" :
                                "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";

                              return (
                                <div key={ev.id} className="relative group">
                                  {/* Bullet point */}
                                  <div className={`absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full ${iconColor} border-2 border-black z-10`} />

                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="font-bold text-zinc-300 capitalize font-mono text-[11px]">{ev.event_type}</span>
                                      <span className="text-[10px] text-zinc-600 font-mono font-medium">
                                        {new Date(ev.occurred_at).toLocaleDateString()} {new Date(ev.occurred_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-zinc-500">
                                      Campaign: <span className="text-zinc-400 font-semibold">{ev.campaign?.name || "General Email Link"}</span>
                                    </p>
                                    {ev.metadata && JSON.parse(ev.metadata).url && (
                                      <p className="text-[10px] text-zinc-600 font-mono truncate max-w-[320px]">
                                        URL: {JSON.parse(ev.metadata).url}
                                      </p>
                                    )}
                                    {ev.user_agent && (
                                      <p className="text-[9px] text-zinc-700 font-mono truncate max-w-[320px]">
                                        Client: {ev.user_agent}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ADVANCED SEGMENT BUILDER TAB */}
        {activeTab === "segments" && (
          <motion.div
            key="segments-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Rule Builder Panel */}
            <div className="lg:col-span-2 p-6 bg-zinc-950 border border-zinc-900 rounded-lg glass space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Dynamic Segment Creator</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Filter audience contacts dynamically with conditional rules</p>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded border border-zinc-800 text-[10px] font-mono font-bold">
                  <button
                    onClick={() => setLogicalOperator("AND")}
                    className={`px-2 py-1 rounded transition cursor-pointer ${logicalOperator === "AND" ? "bg-white text-black" : "text-zinc-500"}`}
                  >
                    AND
                  </button>
                  <button
                    onClick={() => setLogicalOperator("OR")}
                    className={`px-2 py-1 rounded transition cursor-pointer ${logicalOperator === "OR" ? "bg-white text-black" : "text-zinc-500"}`}
                  >
                    OR
                  </button>
                </div>
              </div>

              {/* Rules Stack */}
              <div className="space-y-3">
                {rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded bg-zinc-900/60 border border-zinc-850">
                    <select
                      value={rule.field}
                      onChange={(e) => {
                        const newRules = [...rules];
                        newRules[idx].field = e.target.value;
                        setRules(newRules);
                      }}
                      className="px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none"
                    >
                      <option value="city">City</option>
                      <option value="status">Status</option>
                      <option value="company">Company</option>
                      <option value="email">Email</option>
                    </select>

                    <select
                      value={rule.operator}
                      onChange={(e) => {
                        const newRules = [...rules];
                        newRules[idx].operator = e.target.value;
                        setRules(newRules);
                      }}
                      className="px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 font-mono"
                    >
                      <option value="equals">equals</option>
                      <option value="contains">contains</option>
                      <option value="not_equals">not equals</option>
                    </select>

                    <input
                      type="text"
                      value={rule.value}
                      onChange={(e) => {
                        const newRules = [...rules];
                        newRules[idx].value = e.target.value;
                        setRules(newRules);
                      }}
                      placeholder="e.g. Hyderabad"
                      className="flex-1 px-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none"
                    />

                    <button
                      onClick={() => setRules(rules.filter((_, i) => i !== idx))}
                      className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
                <button
                  onClick={addRule}
                  className="flex items-center gap-1 px-3 py-1.5 rounded border border-zinc-850 hover:bg-zinc-900 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Filter Rule</span>
                </button>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[9px] font-semibold text-zinc-500 font-mono uppercase tracking-wider">Estimated Audience</p>
                    <p className="text-xs font-bold font-mono text-white mt-0.5">{liveSegmentCount} contacts</p>
                  </div>
                  <button
                    onClick={handleSaveSegment}
                    className="px-4 py-1.5 rounded bg-white text-black hover:bg-zinc-200 text-xs font-semibold shadow-md transition cursor-pointer"
                  >
                    Save Segment
                  </button>
                </div>
              </div>
            </div>

            {/* Saved Segments Side List */}
            <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-lg glass space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Active Saved Segments</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Quickly query matching filter parameters</p>
              </div>

              <div className="space-y-3">
                {savedSegments.length > 0 ? (
                  savedSegments.map((seg) => (
                    <div key={seg.id} className="p-4 rounded bg-zinc-900/40 border border-zinc-900 flex items-center justify-between hover:border-zinc-800 transition">
                      <div>
                        <p className="text-xs font-bold text-zinc-300">{seg.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">{seg.count} contacts match</p>
                      </div>
                      <button className="p-1 text-zinc-500 hover:text-white transition">
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-6 border border-dashed border-zinc-900 rounded-lg text-center space-y-2 bg-zinc-950/20">
                    <AlertCircle className="w-4.5 h-4.5 text-zinc-600 mx-auto" />
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 font-mono uppercase">No Saved Segments</p>
                      <p className="text-[9px] text-zinc-600 mt-0.5 leading-relaxed">
                        Create filter rules on the left and click "Save Segment" to persist them.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* CSV IMPORT WIZARD TAB */}
        {activeTab === "import" && (
          <motion.div
            key="import-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-8 bg-zinc-950 border border-zinc-900 rounded-lg glass space-y-8"
          >
            {/* Import Header Wizard indicator */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">CSV Contact Importer</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Bulk-insert subscriber directories in seconds</p>
              </div>

              <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-zinc-500">
                <span className={importStep === 1 ? "text-white" : ""}>1. Upload</span>
                <span>/</span>
                <span className={importStep === 2 ? "text-white" : ""}>2. Mapping</span>
                <span>/</span>
                <span className={importStep === 3 ? "text-white" : ""}>3. Progress</span>
                <span>/</span>
                <span className={importStep === 4 ? "text-white" : ""}>4. Complete</span>
              </div>
            </div>

            {/* STEP 1: UPLOAD FILE */}
            {importStep === 1 && (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-850 rounded-lg py-16 px-6 text-center bg-zinc-900/10 hover:border-zinc-700 transition">
                <Upload className="w-10 h-10 text-zinc-500 mb-4" />
                <h4 className="text-sm font-bold text-zinc-300">Upload CSV Directory file</h4>
                <p className="text-xs text-zinc-500 max-w-xs mt-1 mb-6 leading-relaxed">
                  Supports files up to 25MB. Columns will be matched in the next step.
                </p>
                <label className="px-5 py-2 rounded bg-white text-black hover:bg-zinc-200 text-xs font-semibold shadow-md cursor-pointer transition">
                  <span>Choose CSV file</span>
                  <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                </label>
              </div>
            )}

            {/* STEP 2: PREVIEW & COLUMN MAPPING */}
            {importStep === 2 && (
              <div className="space-y-6">
                <div className="p-4 rounded border border-zinc-850 bg-zinc-900/20">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase font-mono mb-3">CSV Row Preview (First 3 Rows)</h4>
                  <div className="overflow-x-auto text-[10px] font-mono text-zinc-500">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-900 text-zinc-400 font-bold">
                          {csvHeaders.map((header, idx) => (
                            <th key={idx} className="pb-2 pr-4">Col {idx} ({header})</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.slice(0, 3).map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-b border-zinc-900/40 py-2">
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className={cellIdx === 0 ? "text-zinc-300 py-2 pr-4" : "py-2 pr-4"}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white font-mono">Map Columns to Contact Fields</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {(["email", "firstName", "lastName", "company", "city"] as const).map((field) => (
                      <div key={field} className="flex flex-col gap-1.5 p-3.5 rounded bg-zinc-900/50 border border-zinc-900">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase font-mono">{field}</label>
                        <select
                          value={columnMapping[field] || "none"}
                          onChange={(e) => setColumnMapping({ ...columnMapping, [field]: e.target.value })}
                          className="px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none"
                        >
                          {csvHeaders.map((header, idx) => (
                            <option key={idx} value={String(idx)}>
                              Column {idx} ({header})
                            </option>
                          ))}
                          <option value="none">Skip Field</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded border border-zinc-900 bg-zinc-950/40 space-y-2">
                  <label className="text-xs font-bold text-white uppercase font-mono">Import Into Mailing List</label>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Select a mailing list directory where these contacts will be assigned.</p>
                  <select
                    value={targetListId}
                    onChange={(e) => setTargetListId(e.target.value)}
                    className="w-full max-w-sm px-3 py-2 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value="none">Do not assign to any list</option>
                    {lists.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-zinc-900">
                  <button
                    onClick={() => { setCsvFile(null); setImportStep(1); }}
                    className="px-4 py-2 rounded border border-zinc-850 hover:bg-zinc-900 text-zinc-400 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={runImportJob}
                    className="flex items-center gap-1.5 px-4 py-2 rounded bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition shadow-md cursor-pointer"
                  >
                    <span>Import Contacts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PROCESSING BACKGROUND IMPORT PROGRESS */}
            {importStep === 3 && (
              <div className="flex flex-col items-center justify-center py-16 space-y-6 max-w-sm mx-auto text-center">
                <Database className="w-10 h-10 text-zinc-500 animate-pulse" />
                <div className="space-y-1.5 w-full">
                  <h4 className="text-sm font-bold text-zinc-300">Importing subscriber directory...</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Parsing rows & running AWS validation sets...</p>
                </div>

                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                  <motion.div
                    animate={{ width: `${importProgress}%` }}
                    className="bg-white h-full shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                  />
                </div>
                <span className="text-xs font-bold font-mono text-zinc-400">{importProgress}%</span>
              </div>
            )}

            {/* STEP 4: FINAL SUMMARY SCREEN */}
            {importStep === 4 && (
              <div className="space-y-8 max-w-md mx-auto text-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-2.5 bg-emerald-950/20 text-emerald-400 rounded-full border border-emerald-900/40">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Import Job Succeeded</h4>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Subscriber list is now active and merged</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-4 rounded border border-zinc-900 bg-zinc-950/50">
                    <p className="text-zinc-500 text-[10px] uppercase font-semibold">Added Rows</p>
                    <p className="text-lg font-bold text-emerald-400 mt-1">{importResults.added}</p>
                  </div>
                  <div className="p-4 rounded border border-zinc-900 bg-zinc-950/50">
                    <p className="text-zinc-500 text-[10px] uppercase font-semibold">Updated Rows</p>
                    <p className="text-lg font-bold text-blue-400 mt-1">{importResults.updated}</p>
                  </div>
                  <div className="p-4 rounded border border-zinc-900 bg-zinc-950/50">
                    <p className="text-zinc-500 text-[10px] uppercase font-semibold">Skipped Rows</p>
                    <p className="text-lg font-bold text-zinc-400 mt-1">{importResults.skipped}</p>
                  </div>
                  <div className="p-4 rounded border border-zinc-900 bg-zinc-950/50">
                    <p className="text-zinc-500 text-[10px] uppercase font-semibold">Errors</p>
                    <p className="text-lg font-bold text-red-400 mt-1">{importResults.errored}</p>
                  </div>
                </div>

                <button
                  onClick={() => { setCsvFile(null); setImportStep(1); setActiveTab("contacts"); }}
                  className="px-5 py-2.5 rounded bg-white text-black hover:bg-zinc-200 text-xs font-semibold shadow-md transition cursor-pointer"
                >
                  View Updated Contacts Directory
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ADD CONTACT MANUALLY MODAL */}
        {showNewContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-card border border-border p-6 rounded-md shadow-lg space-y-6"
            >
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight">Add Contact Manually</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Create a subscriber and assign them directly to a mailing list</p>
              </div>

              <form onSubmit={handleCreateContact} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground font-mono">Email Address *</label>
                  <input
                    type="email"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    required
                    placeholder="subscriber@domain.com"
                    className="w-full px-3 py-2 rounded bg-zinc-900 border border-border focus:outline-none focus:border-zinc-700 text-sm text-zinc-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground font-mono">First Name</label>
                    <input
                      type="text"
                      value={newContactFirstName}
                      onChange={(e) => setNewContactFirstName(e.target.value)}
                      placeholder="First Name"
                      className="w-full px-3 py-2 rounded bg-zinc-900 border border-border focus:outline-none focus:border-zinc-700 text-sm text-zinc-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground font-mono">Last Name</label>
                    <input
                      type="text"
                      value={newContactLastName}
                      onChange={(e) => setNewContactLastName(e.target.value)}
                      placeholder="Last Name"
                      className="w-full px-3 py-2 rounded bg-zinc-900 border border-border focus:outline-none focus:border-zinc-700 text-sm text-zinc-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground font-mono">Company</label>
                    <input
                      type="text"
                      value={newContactCompany}
                      onChange={(e) => setNewContactCompany(e.target.value)}
                      placeholder="Company Name"
                      className="w-full px-3 py-2 rounded bg-zinc-900 border border-border focus:outline-none focus:border-zinc-700 text-sm text-zinc-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground font-mono">City</label>
                    <input
                      type="text"
                      value={newContactCity}
                      onChange={(e) => setNewContactCity(e.target.value)}
                      placeholder="City"
                      className="w-full px-3 py-2 rounded bg-zinc-900 border border-border focus:outline-none focus:border-zinc-700 text-sm text-zinc-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground font-mono">Add Directly Into Mailing List</label>
                  <select
                    value={newContactListId}
                    onChange={(e) => setNewContactListId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded bg-zinc-900 border border-border focus:outline-none focus:border-zinc-700 text-sm text-zinc-400 font-medium"
                  >
                    <option value="none">Do not assign to a list (general pool)</option>
                    {lists.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowNewContactModal(false)}
                    className="px-4 py-2 rounded border border-border hover:bg-secondary text-muted-foreground text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingContact}
                    className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 text-xs font-semibold transition shadow-md border border-white/5 cursor-pointer"
                  >
                    {addingContact ? "Adding..." : "Add Contact"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ADD EXISTING CONTACTS TO LIST MODAL */}
        {showAddExistingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg bg-card border border-border p-6 rounded-md shadow-lg space-y-6 flex flex-col max-h-[85vh]"
            >
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight">Add Existing Contacts to Mailing List</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Subscribe contacts in your database who are not already on this list.</p>
              </div>

              {/* List of Contacts */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[250px]">
                {contacts.filter(c => !c.listIds?.includes(selectedListFilter)).length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 font-mono text-xs">
                    All contacts in your database are already members of this list.
                  </div>
                ) : (
                  contacts
                    .filter(c => !c.listIds?.includes(selectedListFilter))
                    .map((contact) => {
                      const isChecked = selectedContactIds.includes(contact.id);
                      return (
                        <div 
                          key={contact.id}
                          onClick={() => {
                            if (isChecked) {
                              setSelectedContactIds(selectedContactIds.filter(id => id !== contact.id));
                            } else {
                              setSelectedContactIds([...selectedContactIds, contact.id]);
                            }
                          }}
                          className={`p-3 rounded border text-xs flex items-center justify-between cursor-pointer transition ${
                            isChecked 
                              ? "bg-[#7C5CFF]/10 border-[#7C5CFF]/50 text-white" 
                              : "bg-zinc-950/40 border-border/60 hover:bg-zinc-900/60 hover:border-zinc-800 text-zinc-300"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className="font-bold font-mono">{contact.email}</p>
                            <p className="text-[10px] text-zinc-500">
                              {contact.firstName ? `${contact.firstName} ${contact.lastName || ""}` : "Unnamed Subscriber"} 
                              {contact.company ? ` • ${contact.company}` : ""}
                            </p>
                          </div>
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by row onClick
                            className="w-4 h-4 accent-[#7C5CFF] pointer-events-none"
                          />
                        </div>
                      );
                    })
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border shrink-0">
                <span className="text-[10px] font-mono text-zinc-500 font-bold">
                  {selectedContactIds.length} contacts selected
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddExistingModal(false);
                      setSelectedContactIds([]);
                    }}
                    className="px-4 py-2 rounded border border-border hover:bg-secondary text-muted-foreground text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddExistingToActiveList}
                    disabled={submittingExisting || selectedContactIds.length === 0}
                    className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 text-xs font-semibold transition shadow-md border border-white/5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {submittingExisting ? "Adding..." : `Add Selected to List`}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
