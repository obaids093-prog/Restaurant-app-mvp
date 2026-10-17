import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { brand } from '../config/brand';
import safeStorage from '../utils/safeStorage';

const BRANCH_STORAGE_KEY = '@aura_selected_branch_id';

const BranchContext = createContext(null);

export function BranchProvider({ children }) {
  // Get active branches from brand configuration
  const activeBranches = useMemo(() => {
    const list = Array.isArray(brand.outlets) ? brand.outlets : [];
    const filtered = list.filter((b) => b.isActive !== false);
    if (filtered.length === 0) {
      // Fallback single outlet if all are disabled
      return [
        {
          id: 'default_branch',
          city: 'Lahore',
          area: 'Gulberg III',
          fullName: 'AURA • Gulberg III, Lahore',
          address: brand.address || '14-C Gulberg III, MM Alam Road, Lahore',
          phone: brand.phone || '0300-8472910',
          openingHours: brand.openingHours || '12:00 PM – 11:00 PM',
          isActive: true,
        },
      ];
    }
    return filtered;
  }, []);

  const isMultiBranch = activeBranches.length > 1;

  // Selected branch state
  const [selectedBranchId, setSelectedBranchId] = useState(activeBranches[0]?.id || 'lhr_gulberg');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load saved branch preference on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const savedId = await safeStorage.getItem(BRANCH_STORAGE_KEY);
        if (savedId && activeBranches.some((b) => b.id === savedId)) {
          if (isMounted) setSelectedBranchId(savedId);
        } else {
          // Default to first active branch
          if (isMounted && activeBranches[0]) {
            setSelectedBranchId(activeBranches[0].id);
          }
        }
      } catch (e) {
        console.warn('Could not load saved branch:', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [activeBranches]);

  // Current active branch object
  const activeBranch = useMemo(() => {
    const found = activeBranches.find((b) => b.id === selectedBranchId);
    return found || activeBranches[0];
  }, [activeBranches, selectedBranchId]);

  // Switch branch function
  const selectBranch = useCallback(
    async (branchId) => {
      const target = activeBranches.find((b) => b.id === branchId);
      if (target) {
        setSelectedBranchId(branchId);
        setIsModalOpen(false);
        try {
          await safeStorage.setItem(BRANCH_STORAGE_KEY, branchId);
        } catch (e) {
          console.warn('Could not persist branch choice:', e);
        }
      }
    },
    [activeBranches]
  );

  const openBranchModal = useCallback(() => {
    if (isMultiBranch) {
      setIsModalOpen(true);
    }
  }, [isMultiBranch]);

  const closeBranchModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      branches: activeBranches,
      activeBranch,
      isMultiBranch,
      selectBranch,
      isModalOpen,
      openBranchModal,
      closeBranchModal,
    }),
    [activeBranches, activeBranch, isMultiBranch, selectBranch, isModalOpen, openBranchModal, closeBranchModal]
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
