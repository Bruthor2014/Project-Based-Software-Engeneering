"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Lock, Trash2, PlusCircle, ChevronDown, ChevronUp, History, Plus, Minus } from "lucide-react"
import { useRouter } from "next/navigation"

interface Nota {
  id: string
  corda_id: string
  nota: string
  quantidade: number
}

interface Log {
  id: string
  tipo_acao: string
  quantidade: number
  nome_pessoa: string
  nome_tuna: string
  motivo: string
  categoria: string
  tipo: string
  nota: string | null
  created_at: string
}

interface Corda {
  id: string
  categoria: string
  tipo: string
  quantidade: number
}

interface InventoryTableProps {
  initialCordas: Corda[]
  tableName: "cordas" | "pack_festival"
}

const ADMIN_PASSWORD = "pipo1999!"

type ModalType = "edit" | "delete" | "add" | "addNota" | "deleteNota" | "logs" | null

export function InventoryTable({ initialCordas, tableName }: InventoryTableProps) {
  const [cordas, setCordas] = useState<Corda[]>(initialCordas)
  const [notas, setNotas] = useState<Record<string, Nota[]>>({})
  const [expandedCordas, setExpandedCordas] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<string | null>(null)
  const [editCategoria, setEditCategoria] = useState<string>("")
  const [editTipo, setEditTipo] = useState<string>("")

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [pendingEdit, setPendingEdit] = useState<Corda | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Corda | null>(null)
  const [pendingAddNota, setPendingAddNota] = useState<Corda | null>(null)
  const [pendingDeleteNota, setPendingDeleteNota] = useState<Nota | null>(null)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState(false)

  // Add/Remove questionnaire states
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false)
  const [questionnaireType, setQuestionnaireType] = useState<"adicionar" | "remover">("adicionar")
  const [questionnaireCorda, setQuestionnaireCorda] = useState<Corda | null>(null)
  const [questionnaireNota, setQuestionnaireNota] = useState<Nota | null>(null)
  const [questNomePessoa, setQuestNomePessoa] = useState("")
  const [questNomeTuna, setQuestNomeTuna] = useState("")
  const [questMotivo, setQuestMotivo] = useState("")
  const [questQuantidade, setQuestQuantidade] = useState(1)
  const [questError, setQuestError] = useState("")

  // Add new corda states
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCategoria, setNewCategoria] = useState("")
  const [newTipo, setNewTipo] = useState("")
  const [addError, setAddError] = useState("")

  // Add nota states
  const [showAddNotaModal, setShowAddNotaModal] = useState(false)
  const [newNota, setNewNota] = useState("")
  const [addNotaError, setAddNotaError] = useState("")

  // Logs states
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [logs, setLogs] = useState<Log[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const notasTableName = tableName === "cordas" ? "cordas_notas" : "pack_festival_notas"
  const logsTableName = tableName === "cordas" ? "cordas_logs" : "pack_festival_logs"

  // Fetch notas for a corda when expanded
  const fetchNotas = async (cordaId: string) => {
    const { data, error } = await supabase
      .from(notasTableName)
      .select("*")
      .eq("corda_id", cordaId)
      .order("nota")

    if (!error && data) {
      setNotas(prev => ({ ...prev, [cordaId]: data }))
    }
  }

  // Fetch logs
  const fetchLogs = async () => {
    setLogsLoading(true)
    const { data, error } = await supabase
      .from(logsTableName)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (!error && data) {
      setLogs(data)
    }
    setLogsLoading(false)
  }

  const toggleExpand = async (cordaId: string) => {
    const newExpanded = new Set(expandedCordas)
    if (newExpanded.has(cordaId)) {
      newExpanded.delete(cordaId)
    } else {
      newExpanded.add(cordaId)
      if (!notas[cordaId]) {
        await fetchNotas(cordaId)
      }
    }
    setExpandedCordas(newExpanded)
  }

  // Open questionnaire for adding/removing
  const openQuestionnaire = (type: "adicionar" | "remover", corda: Corda, nota?: Nota) => {
    setQuestionnaireType(type)
    setQuestionnaireCorda(corda)
    setQuestionnaireNota(nota || null)
    setQuestNomePessoa("")
    setQuestNomeTuna("")
    setQuestMotivo("")
    setQuestQuantidade(1)
    setQuestError("")
    setShowQuestionnaireModal(true)
  }

  const handleQuestionnaireSubmit = async () => {
    if (!questNomePessoa.trim() || !questNomeTuna.trim() || !questMotivo.trim()) {
      setQuestError("Preenche todos os campos")
      return
    }

    if (questQuantidade < 1) {
      setQuestError("A quantidade deve ser pelo menos 1")
      return
    }

    if (!questionnaireCorda) return

    setQuestError("")
    setLoading(questionnaireNota?.id || questionnaireCorda.id)

    // Calculate new quantity
    let newQuantity: number
    if (questionnaireNota) {
      // Updating a nota
      if (questionnaireType === "adicionar") {
        newQuantity = questionnaireNota.quantidade + questQuantidade
      } else {
        newQuantity = Math.max(0, questionnaireNota.quantidade - questQuantidade)
      }

      // Update nota quantity
      const { error: updateError } = await supabase
        .from(notasTableName)
        .update({ quantidade: newQuantity, updated_at: new Date().toISOString() })
        .eq("id", questionnaireNota.id)

      if (!updateError) {
        setNotas(prev => ({
          ...prev,
          [questionnaireNota.corda_id]: prev[questionnaireNota.corda_id].map(n =>
            n.id === questionnaireNota.id ? { ...n, quantidade: newQuantity } : n
          )
        }))
      }

      // Add log entry
      await supabase.from(logsTableName).insert({
        corda_id: questionnaireCorda.id,
        nota_id: questionnaireNota.id,
        tipo_acao: questionnaireType,
        quantidade: questQuantidade,
        nome_pessoa: questNomePessoa.trim(),
        nome_tuna: questNomeTuna.trim(),
        motivo: questMotivo.trim(),
        categoria: questionnaireCorda.categoria,
        tipo: questionnaireCorda.tipo,
        nota: questionnaireNota.nota
      })
    } else {
      // Updating the main corda
      if (questionnaireType === "adicionar") {
        newQuantity = questionnaireCorda.quantidade + questQuantidade
      } else {
        newQuantity = Math.max(0, questionnaireCorda.quantidade - questQuantidade)
      }

      // Update corda quantity
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ quantidade: newQuantity, updated_at: new Date().toISOString() })
        .eq("id", questionnaireCorda.id)

      if (!updateError) {
        setCordas(cordas.map(c => c.id === questionnaireCorda.id ? { ...c, quantidade: newQuantity } : c))
      }

      // Add log entry
      await supabase.from(logsTableName).insert({
        corda_id: questionnaireCorda.id,
        nota_id: null,
        tipo_acao: questionnaireType,
        quantidade: questQuantidade,
        nome_pessoa: questNomePessoa.trim(),
        nome_tuna: questNomeTuna.trim(),
        motivo: questMotivo.trim(),
        categoria: questionnaireCorda.categoria,
        tipo: questionnaireCorda.tipo,
        nota: null
      })
    }

    setLoading(null)
    setShowQuestionnaireModal(false)
    router.refresh()
  }

  const openPasswordModal = (type: ModalType, corda?: Corda, nota?: Nota) => {
    setModalType(type)
    if (type === "edit" && corda) {
      setPendingEdit(corda)
    } else if (type === "delete" && corda) {
      setPendingDelete(corda)
    } else if (type === "addNota" && corda) {
      setPendingAddNota(corda)
    } else if (type === "deleteNota" && nota) {
      setPendingDeleteNota(nota)
    }
    setShowPasswordModal(true)
    setPassword("")
    setPasswordError(false)
  }

  const handlePasswordSubmit = async () => {
    if (password === ADMIN_PASSWORD) {
      setShowPasswordModal(false)

      if (modalType === "edit" && pendingEdit) {
        setEditMode(pendingEdit.id)
        setEditCategoria(pendingEdit.categoria)
        setEditTipo(pendingEdit.tipo)
      } else if (modalType === "delete" && pendingDelete) {
        handleDeleteConfirm(pendingDelete.id)
      } else if (modalType === "add") {
        setShowAddModal(true)
      } else if (modalType === "addNota" && pendingAddNota) {
        setShowAddNotaModal(true)
      } else if (modalType === "deleteNota" && pendingDeleteNota) {
        handleDeleteNota(pendingDeleteNota)
      } else if (modalType === "logs") {
        await fetchLogs()
        setShowLogsModal(true)
      }

      setModalType(null)
    } else {
      setPasswordError(true)
    }
  }

  const handleEditSave = async (id: string) => {
    if (!editCategoria.trim() || !editTipo.trim()) return

    setLoading(id)
    const { error } = await supabase
      .from(tableName)
      .update({
        categoria: editCategoria.trim(),
        tipo: editTipo.trim(),
        updated_at: new Date().toISOString()
      })
      .eq("id", id)

    if (!error) {
      setCordas(cordas.map(c => c.id === id ? {
        ...c,
        categoria: editCategoria.trim(),
        tipo: editTipo.trim()
      } : c))
    }
    router.refresh()
    setLoading(null)
    setEditMode(null)
  }

  const handleEditCancel = () => {
    setEditMode(null)
    setEditCategoria("")
    setEditTipo("")
  }

  const handleDeleteConfirm = async (id: string) => {
    setLoading(id)
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", id)

    if (!error) {
      setCordas(cordas.filter(c => c.id !== id))
    }
    setPendingDelete(null)
    router.refresh()
    setLoading(null)
  }

  const handleDeleteNota = async (nota: Nota) => {
    setLoading(nota.id)
    const { error } = await supabase
      .from(notasTableName)
      .delete()
      .eq("id", nota.id)

    if (!error) {
      setNotas(prev => ({
        ...prev,
        [nota.corda_id]: prev[nota.corda_id].filter(n => n.id !== nota.id)
      }))
    }
    setPendingDeleteNota(null)
    setLoading(null)
  }

  const handleAddNew = async () => {
    if (!newCategoria.trim() || !newTipo.trim()) {
      setAddError("Preenche todos os campos")
      return
    }

    const exists = cordas.some(
      c => c.categoria.toLowerCase() === newCategoria.trim().toLowerCase() &&
        c.tipo.toLowerCase() === newTipo.trim().toLowerCase()
    )

    if (exists) {
      setAddError("Este tipo de corda já existe")
      return
    }

    setAddError("")
    const { data, error } = await supabase
      .from(tableName)
      .insert({
        categoria: newCategoria.trim(),
        tipo: newTipo.trim(),
        quantidade: 0
      })
      .select()
      .single()

    if (!error && data) {
      setCordas([...cordas, data])
      setShowAddModal(false)
      setNewCategoria("")
      setNewTipo("")
      router.refresh()
    } else {
      setAddError("Erro ao adicionar. Tenta novamente.")
    }
  }

  const handleAddNota = async () => {
    if (!newNota.trim() || !pendingAddNota) {
      setAddNotaError("Preenche o nome da nota")
      return
    }

    const existingNotas = notas[pendingAddNota.id] || []
    const exists = existingNotas.some(
      n => n.nota.toLowerCase() === newNota.trim().toLowerCase()
    )

    if (exists) {
      setAddNotaError("Esta nota já existe")
      return
    }

    setAddNotaError("")
    const { data, error } = await supabase
      .from(notasTableName)
      .insert({
        corda_id: pendingAddNota.id,
        nota: newNota.trim(),
        quantidade: 0
      })
      .select()
      .single()

    if (!error && data) {
      setNotas(prev => ({
        ...prev,
        [pendingAddNota.id]: [...(prev[pendingAddNota.id] || []), data]
      }))
      setShowAddNotaModal(false)
      setNewNota("")
      setPendingAddNota(null)
    } else {
      setAddNotaError("Erro ao adicionar. Tenta novamente.")
    }
  }

  const closeAddModal = () => {
    setShowAddModal(false)
    setNewCategoria("")
    setNewTipo("")
    setAddError("")
  }

  const closeAddNotaModal = () => {
    setShowAddNotaModal(false)
    setNewNota("")
    setAddNotaError("")
    setPendingAddNota(null)
  }

  const groupedCordas = cordas.reduce((acc, corda) => {
    if (!acc[corda.categoria]) {
      acc[corda.categoria] = []
    }
    acc[corda.categoria].push(corda)
    return acc
  }, {} as Record<string, Corda[]>)

  const categories = [...new Set(cordas.map(c => c.categoria))]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <>
      {/* Top buttons */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:justify-between">
        <Button
          variant="outline"
          onClick={() => openPasswordModal("logs")}
          className="gap-2 text-xs sm:text-sm w-full sm:w-auto"
        >
          <History className="h-4 w-4" />
          Ver Histórico
        </Button>
        <Button
          onClick={() => openPasswordModal("add")}
          className="gap-2 text-xs sm:text-sm w-full sm:w-auto"
        >
          <PlusCircle className="h-4 w-4" />
          Adicionar Tipo
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(groupedCordas).map(([categoria, items]) => (
          <Card key={categoria} className="border-border bg-card">
            <CardHeader className="border-b border-border pb-3 sm:pb-4 px-3 sm:px-6">
              <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
                {categoria}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6">
              <div className="space-y-2 sm:space-y-3">
                {items.map((corda) => (
                  <div key={corda.id} className="space-y-2">
                    {/* Main corda row */}
                    <div
                      className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-2 sm:p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleExpand(corda.id)}
                          className="h-6 w-6 shrink-0"
                        >
                          {expandedCordas.has(corda.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <div>
                          <p className="font-medium text-foreground text-sm sm:text-base">{corda.tipo}</p>
                        </div>
                      </div>

                      {editMode === corda.id ? (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                          <Card className="w-full max-w-md mx-4">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <Lock className="h-5 w-5" />
                                Editar Corda
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium text-foreground mb-2 block">
                                    Instrumento (Categoria)
                                  </label>
                                  <Input
                                    type="text"
                                    value={editCategoria}
                                    onChange={(e) => setEditCategoria(e.target.value)}
                                    list="edit-categorias"
                                  />
                                  <datalist id="edit-categorias">
                                    {categories.map(cat => (
                                      <option key={cat} value={cat} />
                                    ))}
                                  </datalist>
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-foreground mb-2 block">
                                    Tipo/Marca de Corda
                                  </label>
                                  <Input
                                    type="text"
                                    value={editTipo}
                                    onChange={(e) => setEditTipo(e.target.value)}
                                  />
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <Button
                                    variant="outline"
                                    onClick={handleEditCancel}
                                    className="flex-1"
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    onClick={() => handleEditSave(corda.id)}
                                    className="flex-1"
                                    disabled={loading === corda.id}
                                  >
                                    Guardar
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openPasswordModal("edit", corda)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Editar (requer password)"
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openPasswordModal("delete", corda)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/20"
                            title="Eliminar (requer password)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Expanded notas section */}
                    {expandedCordas.has(corda.id) && (
                      <div className="ml-4 sm:ml-8 space-y-2 border-l-2 border-border pl-2 sm:pl-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Notas:</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openPasswordModal("addNota", corda)}
                            className="h-6 sm:h-7 text-xs gap-1 px-2"
                          >
                            <PlusCircle className="h-3 w-3" />
                            <span className="hidden sm:inline">Adicionar</span> Nota
                          </Button>
                        </div>

                        {(notas[corda.id] || []).length === 0 ? (
                          <p className="text-xs sm:text-sm text-muted-foreground italic">
                            Sem notas registadas
                          </p>
                        ) : (
                          <div className="space-y-1.5 sm:space-y-2">
                            {(notas[corda.id] || []).map((nota) => (
                              <div
                                key={nota.id}
                                className="flex items-center justify-between rounded-md border border-border bg-background p-1.5 sm:p-2"
                              >
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <span className="font-medium text-xs sm:text-sm">{nota.nota}</span>
                                  <span className="text-xs text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                                    {nota.quantidade}
                                  </span>
                                </div>
                                <div className="flex items-center gap-0.5 sm:gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openQuestionnaire("adicionar", corda, nota)}
                                    disabled={loading === nota.id}
                                    className="h-7 sm:h-8 text-xs px-2 sm:px-3 text-green-500 border-green-500/30 hover:bg-green-500/10"
                                  >
                                    <Plus className="h-3 w-3 sm:mr-1" />
                                    <span className="hidden sm:inline">Adicionar</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openQuestionnaire("remover", corda, nota)}
                                    disabled={loading === nota.id || nota.quantidade === 0}
                                    className="h-7 sm:h-8 text-xs px-2 sm:px-3 text-red-500 border-red-500/30 hover:bg-red-500/10"
                                  >
                                    <Minus className="h-3 w-3 sm:mr-1" />
                                    <span className="hidden sm:inline">Remover</span>
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => openPasswordModal("deleteNota", undefined, nota)}
                                    className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/20"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Questionnaire Modal */}
      {showQuestionnaireModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <Card className="w-full sm:max-w-md sm:mx-4 rounded-t-xl sm:rounded-xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">
                {questionnaireType === "adicionar" ? "Adicionar Cordas" : "Remover Cordas"}
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {questionnaireCorda?.categoria} - {questionnaireCorda?.tipo}
                {questionnaireNota && ` - ${questionnaireNota.nota}`}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2 block">
                    O teu nome
                  </label>
                  <Input
                    type="text"
                    value={questNomePessoa}
                    onChange={(e) => setQuestNomePessoa(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="text-base sm:text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2 block">
                    Porquê {questionnaireType === "adicionar" ? "colocaste" : "tiraste"}?
                  </label>
                  <Textarea
                    value={questMotivo}
                    onChange={(e) => setQuestMotivo(e.target.value)}
                    placeholder={questionnaireType === "adicionar"
                      ? "Ex: Trouxe cordas novas"
                      : "Ex: Precisei para o bandolim"}
                    rows={2}
                    className="text-base sm:text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2 block">
                    Quantidade
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={questQuantidade}
                    onChange={(e) => setQuestQuantidade(parseInt(e.target.value) || 1)}
                    className="text-base sm:text-sm"
                  />
                </div>

                {questError && (
                  <p className="text-xs sm:text-sm text-red-500">{questError}</p>
                )}

                <div className="flex gap-2 pt-2 pb-2 sm:pb-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowQuestionnaireModal(false)}
                    className="flex-1 h-11 sm:h-10"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleQuestionnaireSubmit}
                    className="flex-1 h-11 sm:h-10"
                    disabled={loading !== null}
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5" />
                Password Necessária
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder="Introduz a password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError(false)
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                  className={passwordError ? "border-red-500" : ""}
                />
                {passwordError && (
                  <p className="text-sm text-red-500">Password incorreta</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordModal(false)
                      setModalType(null)
                      setPendingEdit(null)
                      setPendingDelete(null)
                      setPendingAddNota(null)
                      setPendingDeleteNota(null)
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handlePasswordSubmit} className="flex-1">
                    Confirmar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add New Corda Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-lg">Adicionar Novo Tipo de Corda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Instrumento (Categoria)
                  </label>
                  <Input
                    type="text"
                    value={newCategoria}
                    onChange={(e) => setNewCategoria(e.target.value)}
                    placeholder="Ex: Bandolim, Guitarra..."
                    list="categorias"
                  />
                  <datalist id="categorias">
                    {categories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Tipo/Marca de Corda
                  </label>
                  <Input
                    type="text"
                    value={newTipo}
                    onChange={(e) => setNewTipo(e.target.value)}
                    placeholder="Ex: Dragão, Thomastik..."
                  />
                </div>

                {addError && (
                  <p className="text-sm text-red-500">{addError}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={closeAddModal}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAddNew} className="flex-1">
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Nota Modal */}
      {showAddNotaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-lg">Adicionar Nova Nota</CardTitle>
              <p className="text-sm text-muted-foreground">
                {pendingAddNota?.categoria} - {pendingAddNota?.tipo}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Nome da Nota
                  </label>
                  <Input
                    type="text"
                    value={newNota}
                    onChange={(e) => setNewNota(e.target.value)}
                    placeholder="Ex: Sol, Ré, Lá, Mi..."
                  />
                </div>

                {addNotaError && (
                  <p className="text-sm text-red-500">{addNotaError}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={closeAddNotaModal}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAddNota} className="flex-1">
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <Card className="w-full sm:max-w-3xl sm:mx-4 max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col rounded-t-xl sm:rounded-xl">
            <CardHeader className="border-b border-border py-3 sm:py-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <History className="h-4 w-4 sm:h-5 sm:w-5" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pt-3 sm:pt-4 px-3 sm:px-6">
              {logsLoading ? (
                <p className="text-center text-muted-foreground text-sm">A carregar...</p>
              ) : logs.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm">Sem registos</p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`rounded-lg border p-2 sm:p-3 ${log.tipo_acao === "adicionar"
                        ? "border-green-500/30 bg-green-500/10"
                        : "border-red-500/30 bg-red-500/10"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                        <span className={`text-xs sm:text-sm font-semibold ${log.tipo_acao === "adicionar" ? "text-green-500" : "text-red-500"
                          }`}>
                          {log.tipo_acao === "adicionar" ? "+" : "-"}{log.quantidade}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm space-y-0.5 sm:space-y-1">
                        <p className="font-medium">
                          {log.categoria} - {log.tipo}
                          {log.nota && ` - ${log.nota}`}
                        </p>
                        <p className="text-muted-foreground">
                          {log.nome_pessoa}
                        </p>
                        <p className="text-muted-foreground italic">
                          {log.motivo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <div className="p-3 sm:p-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setShowLogsModal(false)}
                className="w-full h-11 sm:h-10"
              >
                Fechar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
