"use client";

import { useState } from "react";
import {
  Lock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  UserCheck,
  CheckCircle,
  Users,
} from "lucide-react";
import type { StudentCarmenProfile, IndividualStudyRecommendation } from "../types";
import { MOCK_CARMEN_STUDENTS } from "../mock-carmen-data";

interface IndividualAiRecommendationsProps {
  currentStudentId?: string;
  onSelectStudent?: (studentId: string) => void;
  onAddToActionPlan?: (rec: IndividualStudyRecommendation) => void;
}

export function IndividualAiRecommendations({
  currentStudentId = "11111111-1111-4111-8111-111111111111",
  onSelectStudent,
  onAddToActionPlan,
}: IndividualAiRecommendationsProps) {
  const [selectedId, setSelectedId] = useState(currentStudentId);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const activeStudent: StudentCarmenProfile =
    MOCK_CARMEN_STUDENTS[selectedId] || MOCK_CARMEN_STUDENTS["11111111-1111-4111-8111-111111111111"];

  const handleStudentSwitch = (id: string) => {
    setSelectedId(id);
    if (onSelectStudent) onSelectStudent(id);
  };

  const handleAddAction = (rec: IndividualStudyRecommendation) => {
    setAddedIds((prev) => ({ ...prev, [rec.id]: true }));
    if (onAddToActionPlan) onAddToActionPlan(rec);
  };

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white/70 backdrop-blur-md p-3 shadow-2xs transition-all">
      {/* Clean Apple-style Accordion Header */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-stone-200 text-scarlet-deep flex items-center justify-center shrink-0">
            <Lock size={13} className="text-scarlet-dark" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-stone-800">
                CarmenCanvas Personal Study Focus
              </span>
              <span className="text-[10px] text-stone-400 font-mono hidden xs:inline">
                ({activeStudent.name.split(" ")[0]} · Private)
              </span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            {Object.values(MOCK_CARMEN_STUDENTS).map((student) => (
              <button
                key={student.studentId}
                type="button"
                onClick={() => {
                  handleStudentSwitch(student.studentId);
                  setIsExpanded(true);
                }}
                className={`px-1.5 py-0.5 text-[10px] font-medium rounded cursor-pointer transition-all ${
                  selectedId === student.studentId
                    ? "bg-white text-scarlet font-semibold shadow-2xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {student.name.split(" ")[0]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 cursor-pointer"
            aria-label={isExpanded ? "Collapse recommendations" : "Expand recommendations"}
          >
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded Carmen Canvas Insights */}
      {isExpanded && (
        <div className="mt-3 pt-2.5 border-t border-stone-200/60 space-y-2.5">
          <p className="text-[10px] text-scarlet-deep leading-relaxed bg-stone-100 border border-stone-300 p-2 rounded-xl">
            🔒 <strong>Private to {activeStudent.name}:</strong> Tailored from your Canvas Quiz analytics ({activeStudent.buckeyeIdDisplay}). Never shown to other members.
          </p>

          <div className="space-y-2">
            {activeStudent.individualRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="rounded-xl border border-stone-200 bg-white/95 p-3 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-stone-900">{rec.topic}</span>
                  <span className="text-[9px] font-semibold text-red-800 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 font-mono">
                    {rec.carmenCourseCode}
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-snug">{rec.reason}</p>

                <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                  <span className="text-[11px] text-stone-700 font-medium truncate">
                    → {rec.actionItem}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleAddAction(rec)}
                    disabled={addedIds[rec.id]}
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg cursor-pointer transition-colors ${
                      addedIds[rec.id]
                        ? "bg-stone-200 text-scarlet-deep"
                        : "bg-scarlet-dark hover:bg-scarlet-deep text-white"
                    }`}
                  >
                    {addedIds[rec.id] ? <CheckCircle size={11} /> : null}
                    <span>{addedIds[rec.id] ? "Added" : "Focus on this"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
