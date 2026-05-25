import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Course } from '@/types/database';

export function useCourses(userId?: string) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: true });

    if (error || !data) {
      setLoading(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = data as any[];

    if (userId) {
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', userId);

      const enrollMap = new Map(
        (enrollments ?? []).map((e: { course_id: string }) => [e.course_id, e])
      );
      setCourses(rows.map((c) => ({ ...c, enrollment: enrollMap.get(c.id) ?? null })));
    } else {
      setCourses(rows);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const enroll = useCallback(async (courseId: string) => {
    if (!userId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('course_enrollments')
      .insert({ course_id: courseId, user_id: userId, progress: 0 });
    if (!error) {
      setCourses((prev) =>
        prev.map((c) =>
          c.id !== courseId ? c : {
            ...c,
            enrollment: { course_id: courseId, user_id: userId, progress: 0, completed_at: null, enrolled_at: new Date().toISOString() },
          }
        )
      );
    }
  }, [userId]);

  const updateProgress = useCallback(async (courseId: string, progress: number) => {
    if (!userId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('course_enrollments')
      .update({ progress })
      .eq('course_id', courseId)
      .eq('user_id', userId);
    setCourses((prev) =>
      prev.map((c) =>
        c.id !== courseId ? c : { ...c, enrollment: c.enrollment ? { ...c.enrollment, progress } : c.enrollment }
      )
    );
  }, [userId]);

  return { courses, loading, refetch: fetchCourses, enroll, updateProgress };
}
